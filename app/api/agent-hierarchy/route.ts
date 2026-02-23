import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Session {
  key: string;
  kind: string;
  displayName?: string;
  model?: string;
  totalTokens?: number;
  contextTokens?: number;
  updatedAt?: string;
  channel?: string | null;
  abortedLastRun?: boolean;
  messages?: any[];
}

interface Agent {
  id: string;
  identityName?: string;
  name?: string;
  identityEmoji?: string;
  workspace: string;
  model?: string;
  bindings?: number;
}

export async function GET() {
  try {
    // Fetch all agents
    const { stdout: agentsStdout } = await execAsync('openclaw agents list --json');
    const agentsData: Agent[] = JSON.parse(agentsStdout);
    
    // Fetch all sessions
    const { stdout: sessionsStdout } = await execAsync('openclaw sessions list --json');
    const sessionsData = JSON.parse(sessionsStdout);
    const sessions: Session[] = sessionsData.sessions || [];
    
    // Build hierarchical structure
    const hierarchy = agentsData.map((agent) => {
      // Find the main session for this agent
      const mainSession = sessions.find((s) => 
        s.key.includes(agent.id) && s.kind !== 'subagent'
      );
      
      // Find all subagent sessions for this agent
      const subagents = sessions
        .filter((s) => 
          s.kind === 'subagent' && s.key.includes(agent.id)
        )
        .map((sub) => ({
          key: sub.key,
          displayName: sub.displayName || sub.key.split(':').pop() || 'Unnamed',
          model: sub.model || 'unknown',
          tokens: sub.totalTokens || 0,
          contextTokens: sub.contextTokens || 0,
          lastActive: sub.updatedAt ? new Date(sub.updatedAt).toISOString() : null,
          status: sub.abortedLastRun ? 'error' : 'active',
          channel: sub.channel || null
        }));
      
      return {
        id: agent.id,
        name: agent.identityName || agent.name || agent.id,
        emoji: agent.identityEmoji || '🤖',
        workspace: agent.workspace,
        active: !!mainSession,
        model: mainSession?.model || agent.model || 'N/A',
        tokens: mainSession?.totalTokens || 0,
        contextTokens: mainSession?.contextTokens || 0,
        lastActive: mainSession?.updatedAt ? new Date(mainSession.updatedAt).toISOString() : null,
        kind: mainSession?.kind || 'idle',
        channel: mainSession?.channel || null,
        bindings: agent.bindings || 0,
        subagents
      };
    });
    
    return NextResponse.json({ hierarchy });
  } catch (error: any) {
    console.error('Error fetching agent hierarchy:', error);
    return NextResponse.json({ 
      hierarchy: [], 
      error: error.message 
    }, { status: 500 });
  }
}
