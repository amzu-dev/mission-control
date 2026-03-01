import { NextResponse } from 'next/server';
import { getOpenClawClient } from '@/app/lib/openclaw-client';

export async function GET() {
  try {
    const client = await getOpenClawClient();
    const response = await client.request('sessions.list', {});
    const sessions = response.payload?.sessions || [];
    
    const agents = sessions.map((session: any) => ({
      name: session.displayName || session.key,
      status: session.abortedLastRun ? 'error' : 'active',
      model: session.model || 'unknown',
      tokens: session.totalTokens || 0,
      lastActive: new Date(session.updatedAt).toISOString(),
      kind: session.kind || 'other',
      sessionKey: session.key
    }));
    
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('[API /agents] Error fetching agents:', error);
    return NextResponse.json({ agents: [] }, { status: 500 });
  }
}
