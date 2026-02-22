import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { agentId, name, emoji, model } = await request.json();
    
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
    
    // Update IDENTITY.md if name or emoji provided
    if (name || emoji) {
      const identityPath = join(workspacePath, 'IDENTITY.md');
      if (existsSync(identityPath)) {
        let content = readFileSync(identityPath, 'utf-8');
        
        if (name) {
          content = content.replace(/(\*\*Name:\*\*\s*).+/, `$1${name}`);
        }
        if (emoji) {
          content = content.replace(/(\*\*Emoji:\*\*\s*).+/, `$1${emoji}`);
        }
        
        writeFileSync(identityPath, content, 'utf-8');
      }
    }
    
    // Update agent config with model if provided
    if (model) {
      try {
        // This updates the agent's model in the OpenClaw config
        const configCmd = `openclaw config set agents.list.${agentId}.model '${model}'`;
        await execAsync(configCmd);
      } catch (configError) {
        console.warn('Could not update model in config:', configError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Agent updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
