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
      // Main agent special case - check root workspace first
      agentId === 'main' ? '/Users/venkat/.openclaw/workspace' : null,
      // Dev team agents location
      `/Users/venkat/.openclaw/workspace/dev-team/${agentId}`,
      // Individual workspace location
      `/Users/venkat/.openclaw/workspace/${agentId}`,
      // Legacy agents directory
      `/Users/venkat/.openclaw/agents/${agentId}/workspace`,
      `/Users/venkat/.openclaw/agents/${agentId}/agent`,
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
    
    // Always check both standard locations for all agents
    // Priority order (first match wins for duplicate files):
    // 1. Dev team workspace (highest priority for dev team agents)
    // 2. Standalone workspace
    // 3. Agent workspace directory
    // 4. Agent auth/config directory
    
    const dirsToCheck: string[] = [];
    
    if (agentId === 'main') {
      // Main agent: check root workspace first, then agents/main
      dirsToCheck.push('/Users/venkat/.openclaw/workspace');
      dirsToCheck.push('/Users/venkat/.openclaw/agents/main/agent');
    } else {
      // All other agents: check all possible locations in priority order
      dirsToCheck.push(`/Users/venkat/.openclaw/workspace/dev-team/${agentId}`);
      dirsToCheck.push(`/Users/venkat/.openclaw/workspace/${agentId}`);
      dirsToCheck.push(`/Users/venkat/.openclaw/agents/${agentId}/workspace`);
      dirsToCheck.push(`/Users/venkat/.openclaw/agents/${agentId}/agent`);
    }
    
    // Filter to only existing directories
    const existingDirs = dirsToCheck.filter(dir => existsSync(dir));
    
    console.log(`[API /agent-files] Agent: ${agentId}`);
    console.log(`[API /agent-files] Checking directories:`, existingDirs.length > 0 ? existingDirs : 'none exist yet');
    console.log(`[API /agent-files] Primary path for new files:`, agentDirPath);
    
    // Build a map of files from all directories (first directory in list takes precedence)
    const fileMap = new Map<string, { path: string; content: string; exists: boolean }>();
    
    // Check each directory (first one wins in case of duplicates)
    existingDirs.forEach(dir => {
      readdirSync(dir)
        .filter(f => {
          const fullPath = join(dir, f);
          try {
            const isFile = statSync(fullPath).isFile();
            return isFile && f.endsWith('.md') && allowedFiles.includes(f);
          } catch {
            return false;
          }
        })
        .forEach(filename => {
          // Only add if not already in map (first directory takes precedence)
          if (!fileMap.has(filename)) {
            const filePath = join(dir, filename);
            const content = readFileSync(filePath, 'utf-8');
            fileMap.set(filename, { path: filePath, content, exists: true });
          }
        });
    });
    
    // Build file list: show all allowed files, mark which ones exist
    const files = allowedFiles.map(filename => {
      const fileData = fileMap.get(filename);
      
      if (fileData) {
        return {
          filename,
          content: fileData.content,
          path: fileData.path,
          exists: true
        };
      }
      
      // File doesn't exist in any directory, use primary path
      return {
        filename,
        content: '',
        path: join(agentDirPath, filename),
        exists: false
      };
    });
    
    return NextResponse.json({ files, agentDirPath, workspacePath });
  } catch (error: any) {
    console.error('Error fetching agent files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
