import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { workspacePath } = await request.json();
    
    if (!workspacePath) {
      return NextResponse.json({ error: 'Workspace path required' }, { status: 400 });
    }
    
    // Expand ~ to home directory
    const expandedPath = workspacePath.replace(/^~/, process.env.HOME || '');
    
    // Check if path exists
    if (!existsSync(expandedPath)) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Path does not exist',
        path: expandedPath
      });
    }
    
    // Check if it looks like an openclaw workspace
    const agentsDir = join(expandedPath, 'agents');
    const hasAgents = existsSync(agentsDir);
    
    // Try to get agents list
    let agentCount = 0;
    try {
      const { stdout } = await execAsync('openclaw agents list --json');
      const agents = JSON.parse(stdout);
      agentCount = agents.length;
    } catch (error) {
      console.warn('Could not get agents list:', error);
    }
    
    return NextResponse.json({ 
      valid: true,
      path: expandedPath,
      hasAgents,
      agentCount
    });
  } catch (error: any) {
    console.error('Error verifying workspace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
