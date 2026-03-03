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
    let agentDirPath: string;
    if (agentId === 'main') {
      agentDirPath = '/Users/venkat/.openclaw/agents/main/agent';
    } else {
      agentDirPath = `/Users/venkat/.openclaw/agents/${agentId}/agent`;
    }
    
    // Also check workspace for workspace-specific files
    let workspacePath: string;
    if (agentId === 'main') {
      workspacePath = '/Users/venkat/.openclaw/workspace';
    } else {
      workspacePath = `/Users/venkat/.openclaw/agents/${agentId}/workspace`;
    }
    
    if (!existsSync(agentDirPath)) {
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
    
    const files = [];
    
    // Get files from agent directory
    if (existsSync(agentDirPath)) {
      const agentFiles = readdirSync(agentDirPath)
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
      files.push(...agentFiles);
    }
    
    // Get files from workspace directory (if different)
    if (existsSync(workspacePath) && workspacePath !== agentDirPath) {
      const workspaceFiles = readdirSync(workspacePath)
        .filter(f => {
          const fullPath = join(workspacePath, f);
          const isFile = statSync(fullPath).isFile();
          // Don't add duplicates
          const alreadyExists = files.some(file => file.filename === f);
          return isFile && f.endsWith('.md') && allowedFiles.includes(f) && !alreadyExists;
        })
        .map(filename => {
          const content = readFileSync(join(workspacePath, filename), 'utf-8');
          return {
            filename,
            content,
            path: join(workspacePath, filename)
          };
        });
      files.push(...workspaceFiles);
    }
    
    return NextResponse.json({ files, agentDirPath, workspacePath });
  } catch (error: any) {
    console.error('Error fetching agent files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
