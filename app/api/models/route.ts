import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get configured models from OpenClaw CLI
    const { stdout } = await execAsync('openclaw models list --json');
    const cliData = JSON.parse(stdout);
    
    // Get custom models from openclaw.json config
    const configPath = join(process.env.HOME || '', '.openclaw/openclaw.json');
    let customModels: Array<{ key: string; name: string; provider: string }> = [];
    
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.models?.providers) {
        Object.entries(config.models.providers).forEach(([provider, providerConfig]: [string, any]) => {
          if (providerConfig.models && Array.isArray(providerConfig.models)) {
            providerConfig.models.forEach((model: any) => {
              customModels.push({
                key: `${provider}/${model.id}`,
                name: model.name || model.id,
                provider
              });
            });
          }
        });
      }
    } catch (error) {
      console.error('[API /models] Error reading custom models:', error);
    }
    
    // Transform CLI models to a simpler format
    const configuredModels = cliData.models.map((m: any) => ({
      key: m.key,
      name: m.name,
      available: m.available,
      tags: m.tags || []
    }));
    
    // Combine and deduplicate
    const allModelsMap = new Map();
    
    // Add configured models first
    configuredModels.forEach((m: any) => {
      allModelsMap.set(m.key, {
        id: m.key,
        name: m.name,
        available: m.available,
        isDefault: m.tags?.includes('default') || false,
        tags: m.tags || []
      });
    });
    
    // Add custom models (overwrite if already exists)
    customModels.forEach((m) => {
      allModelsMap.set(m.key, {
        id: m.key,
        name: m.name,
        available: true,
        isDefault: false,
        isCustom: true,
        provider: m.provider,
        tags: ['custom']
      });
    });
    
    const models = Array.from(allModelsMap.values())
      .sort((a, b) => {
        // Sort: default first, then by name
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.name.localeCompare(b.name);
      });
    
    return NextResponse.json({ models, count: models.length });
  } catch (error: any) {
    console.error('[API /models] Error fetching models:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
