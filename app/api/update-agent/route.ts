import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { agentId, name, emoji, model } = await request.json();
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    
    // Determine workspace path
    let workspacePath: string;
    if (agentId === 'main') {
      workspacePath = '/Users/venkat/.openclaw/workspace';
    } else {
      workspacePath = `/Users/venkat/.openclaw/agents/${agentId}/workspace`;
    }
    
    if (!existsSync(workspacePath)) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }
    
    // Update IDENTITY.md if name or emoji provided
    if (name || emoji) {
      const identityPath = join(workspacePath, 'IDENTITY.md');
      if (existsSync(identityPath)) {
        let content = readFileSync(identityPath, 'utf-8');
        
        if (name) {
          content = content.replace(/(\*\*Name:\*\*\s*).+/, `$1${name}`);
        }
        if (emoji) {
          content = content.replace(/(\*\*Emoji:\*\*\s*).+/, `$1${emoji}`);
        }
        
        writeFileSync(identityPath, content, 'utf-8');
      }
    }
    
    // Track if model was changed (requires gateway restart)
    let modelChanged = false;
    
    // Update agent config with model if provided
    if (model) {
      try {
        // Read current config
        const configPath = join(process.env.HOME || '', '.openclaw/openclaw.json');
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        
        // Find agent in config
        if (!config.agents) config.agents = {};
        if (!config.agents.list) config.agents.list = [];
        
        let agentConfig = config.agents.list.find((a: any) => a.id === agentId);
        const oldModel = agentConfig?.model?.primary || null;
        
        if (!agentConfig) {
          // Create agent config if doesn't exist
          agentConfig = { id: agentId };
          config.agents.list.push(agentConfig);
        }
        
        // Update model (use object format with primary key)
        agentConfig.model = {
          primary: model
        };
        
        // Check if model actually changed
        modelChanged = oldModel !== model;
        
        // Write back to config file
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        
        console.log(`[API /update-agent] Updated ${agentId} model from ${oldModel || 'default'} to ${model}`);
      } catch (configError) {
        console.error('Could not update model in config:', configError);
        return NextResponse.json({ 
          error: `Failed to save model: ${configError instanceof Error ? configError.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Agent updated successfully',
      modelChanged,
      requiresRestart: modelChanged
    });
  } catch (error: any) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
