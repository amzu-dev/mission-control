import { NextResponse } from 'next/server';
import { getOpenClawClient } from '@/app/lib/openclaw-client';

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
    
    // Transform to match expected format
    const agent = {
      id: agentId,
      identityName: agentData.identity?.name || agentData.name || agentId,
      identityEmoji: agentData.identity?.emoji || '🤖',
      model: agentData.model || 'anthropic/claude-sonnet-4-5',
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
