import { NextResponse } from 'next/server';
import { getOpenClawClient } from '@/app/lib/openclaw-client';

export async function GET() {
  try {
    const client = await getOpenClawClient();
    
    // Get all available agents with full details
    const agentsResponse = await client.request('agents.list', {});
    const agentsData = agentsResponse.payload || [];
    
    // Get all sessions to match with agents
    const sessionsResponse = await client.request('sessions.list', {});
    const sessionsData = sessionsResponse.payload?.sessions || [];
    
    // Map agents with their session data
    const agents = agentsData.map((agent: any) => {
      // Find matching session for this agent
      const session = sessionsData.find((s: any) => 
        s.key.includes(agent.id)
      );
      
      return {
        id: agent.id,
        name: agent.identityName || agent.name || agent.id,
        emoji: agent.identityEmoji || '🤖',
        workspace: agent.workspace,
        configured: true,
        active: !!session,
        model: session?.model || agent.model || 'N/A',
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
