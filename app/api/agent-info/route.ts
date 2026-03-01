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
    const sessions = await client.listSessions();
    
    // Find the specific agent by session key
    const agent = sessions.find((s: any) => s.key === agentId);
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error('[API /agent-info] Error fetching agent info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
