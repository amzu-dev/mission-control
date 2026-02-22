import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// GET - List all subagents
export async function GET() {
  try {
    const { stdout } = await execAsync('openclaw sessions list --json');
    const data = JSON.parse(stdout);
    
    // Filter for subagent sessions
    const subagents = (data.sessions || [])
      .filter((s: any) => s.kind === 'subagent')
      .map((session: any) => ({
        id: session.key,
        displayName: session.displayName || session.key,
        model: session.model || 'unknown',
        tokens: session.totalTokens || 0,
        contextTokens: session.contextTokens || 0,
        createdAt: session.createdAt,
        lastActive: session.updatedAt,
        status: session.abortedLastRun ? 'error' : 'active',
        task: session.initialMessage || '',
        messages: session.messages || []
      }));
    
    return NextResponse.json({ subagents });
  } catch (error: any) {
    console.error('Error fetching subagents:', error);
    return NextResponse.json({ subagents: [], error: error.message });
  }
}

// POST - Create/spawn a new subagent
export async function POST(request: Request) {
  try {
    const { 
      task, 
      label, 
      agentId, 
      model,
      mode = 'session',
      cleanup = 'keep',
      timeoutSeconds = 300
    } = await request.json();
    
    if (!task) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 });
    }
    
    // Build spawn command
    let cmd = `openclaw sessions spawn --task "${task.replace(/"/g, '\\"')}"`;
    
    if (label) {
      cmd += ` --label "${label}"`;
    }
    
    if (agentId) {
      cmd += ` --agent-id ${agentId}`;
    }
    
    if (model) {
      cmd += ` --model ${model}`;
    }
    
    cmd += ` --mode ${mode}`;
    cmd += ` --cleanup ${cleanup}`;
    cmd += ` --timeout-seconds ${timeoutSeconds}`;
    cmd += ` --json`;
    
    const { stdout } = await execAsync(cmd);
    const result = JSON.parse(stdout);
    
    return NextResponse.json({ 
      success: true, 
      subagent: result,
      message: 'Subagent spawned successfully'
    });
  } catch (error: any) {
    console.error('Error creating subagent:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Kill a subagent
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subagentId = searchParams.get('id');
    
    if (!subagentId) {
      return NextResponse.json({ error: 'Subagent ID required' }, { status: 400 });
    }
    
    // Kill the subagent session
    await execAsync(`openclaw subagents kill ${subagentId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subagent terminated successfully'
    });
  } catch (error: any) {
    console.error('Error deleting subagent:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
