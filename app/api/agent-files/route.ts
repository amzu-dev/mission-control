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
    
    // Determine workspace path
    let workspacePath: string;
    if (agentId === 'main') {
      workspacePath = '/Users/venkat/.openclaw/workspace';
    } else {
      workspacePath = `/Users/venkat/.openclaw/agents/${agentId}/workspace`;
    }
    
    if (!existsSync(workspacePath)) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
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
    
    // Get only core agent .md files (not subdirectories or other files)
    const files = readdirSync(workspacePath)
      .filter(f => {
        const fullPath = join(workspacePath, f);
        const isFile = statSync(fullPath).isFile();
        return isFile && f.endsWith('.md') && allowedFiles.includes(f);
      })
      .map(filename => {
        const content = readFileSync(join(workspacePath, filename), 'utf-8');
        return {
          filename,
          content,
          path: join(workspacePath, filename)
        };
      });
    
    return NextResponse.json({ files, workspacePath });
  } catch (error: any) {
    console.error('Error fetching agent files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
