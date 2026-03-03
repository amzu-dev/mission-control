import { NextResponse } from 'next/server';
import { getOpenClawClient } from '@/app/lib/openclaw-client';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    
    const client = await getOpenClawClient();
    
    // List all agents and find the one we want
    const agents = await client.listAgents();
    const agentData = agents.find((a: any) => a.id === agentId);
    
    if (!agentData) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    // Read model from config file (more accurate than WebSocket response)
    let configuredModel = agentData.model || 'anthropic/claude-sonnet-4-5';
    try {
      const configPath = join(process.env.HOME || '', '.openclaw/openclaw.json');
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      
      // Find agent in config
      const agentConfig = config.agents?.list?.find((a: any) => a.id === agentId);
      if (agentConfig?.model) {
        // Handle both string format and object format
        if (typeof agentConfig.model === 'string') {
          configuredModel = agentConfig.model;
        } else if (agentConfig.model.primary) {
          configuredModel = agentConfig.model.primary;
        }
      }
    } catch (configError) {
      console.warn('[API /agent-info] Could not read config for model:', configError);
    }
    
    // Transform to match expected format
    const agent = {
      id: agentId,
      identityName: agentData.identity?.name || agentData.name || agentId,
      identityEmoji: agentData.identity?.emoji || '🤖',
      model: configuredModel,
      workspace: agentData.workspace || `~/.openclaw/agents/${agentId}/workspace`,
      bindings: agentData.bindings || 0,
      isDefault: agentId === 'main'
    };
    
    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error('[API /agent-info] Error fetching agent info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
