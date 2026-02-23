import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

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

interface OpenClawConfig {
  agents?: {
    list?: Array<{
      id: string;
      subagents?: {
        allowAgents?: string[];
      };
    }>;
  };
}

export async function GET() {
  try {
    // Read OpenClaw config to get subagent relationships
    const configPath = join(homedir(), '.openclaw', 'openclaw.json');
    let configuredTeams: Map<string, string[]> = new Map();
    
    try {
      const configContent = await readFile(configPath, 'utf-8');
      const config: OpenClawConfig = JSON.parse(configContent);
      
      if (config.agents?.list) {
        config.agents.list.forEach(agent => {
          if (agent.subagents?.allowAgents) {
            configuredTeams.set(agent.id, agent.subagents.allowAgents);
          }
        });
      }
    } catch (error) {
      console.error('Failed to read OpenClaw config:', error);
    }
    
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
      const activeSubagents = sessions
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
          channel: sub.channel || null,
          type: 'active' as const
        }));
      
      // Get configured team members (allowAgents)
      const allowedAgents = configuredTeams.get(agent.id) || [];
      const teamMembers = allowedAgents.map(memberId => {
        const memberAgent = agentsData.find(a => a.id === memberId);
        return {
          id: memberId,
          name: memberAgent?.identityName || memberAgent?.name || memberId,
          emoji: memberAgent?.identityEmoji || '🤖',
          type: 'team' as const
        };
      });
      
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
        subagents: activeSubagents,
        teamMembers
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
