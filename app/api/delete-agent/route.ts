import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { agentId } = await request.json();
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    
    // Safety check: prevent deleting main agent
    if (agentId === 'main') {
      return NextResponse.json({ 
        error: 'Cannot delete the main agent' 
      }, { status: 403 });
    }
    
    // Execute openclaw agents delete command with --force and --json flags
    const { stdout, stderr } = await execAsync(`openclaw agents delete "${agentId}" --force --json`);
    
    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      // If JSON parsing fails, return raw output
      result = { raw: stdout, stderr };
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Agent "${agentId}" deleted successfully`,
      result
    });
  } catch (error: any) {
    console.error('Error deleting agent:', error);
    
    // Check if error message contains useful info
    const errorMessage = error.stderr || error.message || 'Failed to delete agent';
    
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
