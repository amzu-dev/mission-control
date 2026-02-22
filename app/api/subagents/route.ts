import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get all sessions and filter for subagents
    const { stdout } = await execAsync('openclaw sessions list --json', { timeout: 5000 });
    const data = JSON.parse(stdout);
    
    // Filter for subagent sessions (kind: "subagent" or sessions with parent context)
    const subagents = (data.sessions || [])
      .filter((s: any) => s.kind === 'subagent' || s.key.includes('subagent'))
      .map((session: any) => ({
        key: session.key,
        displayName: session.displayName || session.key,
        model: session.model || 'unknown',
        tokens: session.totalTokens || 0,
        contextTokens: session.contextTokens || 0,
        lastActive: session.updatedAt ? new Date(session.updatedAt).toISOString() : new Date().toISOString(),
        channel: session.channel || null,
        status: session.abortedLastRun ? 'error' : 'active',
        messages: session.messages || [],
        transcriptPath: session.transcriptPath || ''
      }));
    
    return NextResponse.json({ subagents });
  } catch (error: any) {
    console.error('Error fetching subagents:', error);
    return NextResponse.json({ subagents: [], error: error.message }, { status: 200 });
  }
}
