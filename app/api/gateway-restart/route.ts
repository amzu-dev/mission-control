import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Function to check if gateway is responding
async function checkGatewayHealth(maxAttempts = 30, delayMs = 1000): Promise<boolean> {
  const { getOpenClawClient, isClientConnected } = await import('@/app/lib/openclaw-client');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try to connect to gateway
      const client = await getOpenClawClient();
      
      // Try a simple request to verify it's actually working
      await client.request('agents.list', {});
      
      console.log(`[Gateway Restart] Gateway is healthy (attempt ${attempt}/${maxAttempts})`);
      return true;
    } catch (error) {
      console.log(`[Gateway Restart] Gateway not ready yet (attempt ${attempt}/${maxAttempts}):`, error instanceof Error ? error.message : 'Unknown error');
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return false;
}

export async function POST(request: Request) {
  try {
    const { reason } = await request.json();
    
    console.log(`[Gateway Restart] Initiating restart. Reason: ${reason || 'Manual request'}`);
    
    // Disconnect current WebSocket connection
    const { disconnectClient } = await import('@/app/lib/openclaw-client');
    disconnectClient();
    
    // Restart the gateway using CLI command
    try {
      const { stdout, stderr } = await execAsync('openclaw gateway restart');
      console.log('[Gateway Restart] Command output:', stdout);
      if (stderr) console.warn('[Gateway Restart] Command stderr:', stderr);
    } catch (execError) {
      console.error('[Gateway Restart] Failed to execute restart command:', execError);
      return NextResponse.json({ 
        error: 'Failed to restart gateway',
        details: execError instanceof Error ? execError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Wait a moment for the gateway to start shutting down
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Wait for gateway to come back online
    console.log('[Gateway Restart] Waiting for gateway to come back online...');
    const isHealthy = await checkGatewayHealth(30, 1000); // 30 seconds max wait
    
    if (isHealthy) {
      console.log('[Gateway Restart] Gateway successfully restarted and is healthy');
      return NextResponse.json({ 
        success: true, 
        message: 'Gateway restarted successfully',
        timeMs: Date.now()
      });
    } else {
      console.error('[Gateway Restart] Gateway did not come back online within timeout');
      return NextResponse.json({ 
        error: 'Gateway restarted but did not come back online within 30 seconds',
        warning: 'It may still be starting up. Please refresh the page in a moment.'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Gateway Restart] Error during restart:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to restart gateway' 
    }, { status: 500 });
  }
}
