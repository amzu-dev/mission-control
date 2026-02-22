import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    
    // Get all agents info
    const { stdout } = await execAsync('openclaw agents list --json');
    const agents = JSON.parse(stdout);
    
    // Find the specific agent
    const agent = agents.find((a: any) => a.id === agentId);
    
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    
    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error('Error fetching agent info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
