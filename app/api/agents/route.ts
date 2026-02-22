import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get sessions list via openclaw CLI
    const { stdout } = await execAsync('openclaw sessions list --json');
    const sessions = JSON.parse(stdout);
    
    // Transform to agent-friendly format
    const agents = sessions.sessions?.map((session: any) => ({
      name: session.displayName || session.key,
      status: session.abortedLastRun ? 'error' : 'active',
      model: session.model || 'unknown',
      tokens: session.totalTokens || 0,
      lastActive: new Date(session.updatedAt).toISOString(),
      kind: session.kind || 'other'
    })) || [];
    
    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ agents: [] });
  }
}
