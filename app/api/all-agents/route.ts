import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get all available agents with full details
    const { stdout: agentsStdout } = await execAsync('openclaw agents list --json');
    const agentsData = JSON.parse(agentsStdout);
    
    // Get all sessions to match with agents
    const { stdout: sessionsStdout } = await execAsync('openclaw sessions list --json');
    const sessionsData = JSON.parse(sessionsStdout);
    
    // Map agents with their session data
    const agents = agentsData.map((agent: any) => {
      // Find matching session for this agent
      const session = sessionsData.sessions?.find((s: any) => 
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
    console.error('Error fetching agents:', error);
    return NextResponse.json({ agents: [] });
  }
}
