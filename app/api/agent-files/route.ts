import { NextResponse } from 'next/server';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    
    // Determine agent directory path (where SOUL.md, IDENTITY.md, etc. live)
    // Try multiple locations in order of preference
    const possiblePaths = [
      // Dev team agents location
      `/Users/venkat/.openclaw/workspace/dev-team/${agentId}`,
      // Individual workspace location
      `/Users/venkat/.openclaw/workspace/${agentId}`,
      // Legacy agents directory
      `/Users/venkat/.openclaw/agents/${agentId}/workspace`,
      `/Users/venkat/.openclaw/agents/${agentId}/agent`,
      // Main agent special case
      agentId === 'main' ? '/Users/venkat/.openclaw/workspace' : null,
      agentId === 'main' ? '/Users/venkat/.openclaw/agents/main/agent' : null,
    ].filter(Boolean) as string[];
    
    let agentDirPath: string | null = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        agentDirPath = path;
        break;
      }
    }
    
    // Workspace path is the same as agent dir for now
    const workspacePath = agentDirPath;
    
    if (!agentDirPath || !existsSync(agentDirPath)) {
      return NextResponse.json({ error: 'Agent directory not found' }, { status: 404 });
    }
    
    // Core agent configuration files to show
    const allowedFiles = [
      'IDENTITY.md',
      'SOUL.md',
      'USER.md',
      'AGENTS.md',
      'TOOLS.md',
      'HEARTBEAT.md',
      'BOOTSTRAP.md'
    ];
    
    // Get all markdown files from the agent directory
    const files = readdirSync(agentDirPath)
      .filter(f => {
        const fullPath = join(agentDirPath, f);
        const isFile = statSync(fullPath).isFile();
        return isFile && f.endsWith('.md') && allowedFiles.includes(f);
      })
      .map(filename => {
        const content = readFileSync(join(agentDirPath, filename), 'utf-8');
        return {
          filename,
          content,
          path: join(agentDirPath, filename)
        };
      });
    
    return NextResponse.json({ files, agentDirPath, workspacePath });
  } catch (error: any) {
    console.error('Error fetching agent files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
