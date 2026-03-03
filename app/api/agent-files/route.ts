import { NextResponse } from 'next/server';
import { readFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'fs';
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
    
    // If directory doesn't exist, create it
    if (!agentDirPath) {
      // Default to creating workspace in agents directory
      agentDirPath = `/Users/venkat/.openclaw/agents/${agentId}/workspace`;
    }
    
    if (!existsSync(agentDirPath)) {
      try {
        mkdirSync(agentDirPath, { recursive: true });
        console.log(`[API /agent-files] Created workspace directory: ${agentDirPath}`);
      } catch (error) {
        console.error(`[API /agent-files] Failed to create directory:`, error);
        return NextResponse.json({ error: 'Failed to create agent workspace' }, { status: 500 });
      }
    }
    
    // Core agent configuration files to show (always show these, even if they don't exist)
    const allowedFiles = [
      'IDENTITY.md',
      'SOUL.md',
      'USER.md',
      'AGENTS.md',
      'TOOLS.md',
      'HEARTBEAT.md',
      'BOOTSTRAP.md'
    ];
    
    // Get existing files from the agent directory
    const existingFiles = new Set<string>();
    if (existsSync(agentDirPath)) {
      readdirSync(agentDirPath)
        .filter(f => {
          const fullPath = join(agentDirPath, f);
          try {
            const isFile = statSync(fullPath).isFile();
            return isFile && f.endsWith('.md') && allowedFiles.includes(f);
          } catch {
            return false;
          }
        })
        .forEach(f => existingFiles.add(f));
    }
    
    // Build file list: show all allowed files, mark which ones exist
    const files = allowedFiles.map(filename => {
      const filePath = join(agentDirPath, filename);
      const exists = existingFiles.has(filename);
      
      return {
        filename,
        content: exists ? readFileSync(filePath, 'utf-8') : '',
        path: filePath,
        exists
      };
    });
    
    return NextResponse.json({ files, agentDirPath, workspacePath });
  } catch (error: any) {
    console.error('Error fetching agent files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
