import { NextResponse } from 'next/server';
import { getOpenClawClient } from '@/app/lib/openclaw-client';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const client = await getOpenClawClient();
    
    // Get all available agents with full details
    const agentsResponse = await client.request('agents.list', {});
    const agentsData = agentsResponse.payload?.agents || [];
    
    // Get all sessions to match with agents
    const sessionsResponse = await client.request('sessions.list', {});
    const sessionsData = sessionsResponse.payload?.sessions || [];
    
    // Read agent models from config file (more accurate than WebSocket)
    const agentModels = new Map<string, string>();
    try {
      const configPath = join(process.env.HOME || '', '.openclaw/openclaw.json');
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      
      config.agents?.list?.forEach((agentConfig: any) => {
        if (agentConfig.model) {
          const modelId = typeof agentConfig.model === 'string' 
            ? agentConfig.model 
            : agentConfig.model.primary;
          if (modelId) {
            agentModels.set(agentConfig.id, modelId);
          }
        }
      });
    } catch (configError) {
      console.warn('[API /all-agents] Could not read models from config:', configError);
    }
    
    // Map agents with their session data
    const agents = agentsData.map((agent: any) => {
      // Find matching session for this agent
      const session = sessionsData.find((s: any) => 
        s.key.includes(agent.id)
      );
      
      // Use model from config if available, fallback to session/agent model
      const configuredModel = agentModels.get(agent.id);
      const displayModel = configuredModel || session?.model || agent.model || 'N/A';
      
      return {
        id: agent.id,
        name: agent.identityName || agent.name || agent.id,
        emoji: agent.identityEmoji || '🤖',
        workspace: agent.workspace,
        configured: true,
        active: !!session,
        model: displayModel,
        tokens: session?.totalTokens || 0,
        contextTokens: session?.contextTokens || 0,
        lastActive: session?.updatedAt ? new Date(session.updatedAt).toISOString() : null,
        kind: session?.kind || 'idle',
        channel: session?.channel || null,
        bindings: agent.bindings || 0
      };
    });
    
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('[API /all-agents] Error fetching agents:', error);
    return NextResponse.json({ agents: [] }, { status: 500 });
  }
}
