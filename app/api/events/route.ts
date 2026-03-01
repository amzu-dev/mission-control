import { getOpenClawClient } from '@/app/lib/openclaw-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let client: any = null;
      let keepAlive: NodeJS.Timeout | null = null;
      
      try {
        client = await getOpenClawClient();
        
        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
        
        // Subscribe to agent events
        const onAgentStatus = (msg: any) => {
          try {
            const data = `data: ${JSON.stringify({ type: 'agent.status', payload: msg.payload })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            console.error('[SSE] Error encoding agent.status:', e);
          }
        };
        
        // Subscribe to session events
        const onSessionUpdated = (msg: any) => {
          try {
            const data = `data: ${JSON.stringify({ type: 'session.updated', payload: msg.payload })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            console.error('[SSE] Error encoding session.updated:', e);
          }
        };
        
        // Subscribe to presence events (agent online/offline)
        const onPresence = (msg: any) => {
          try {
            const data = `data: ${JSON.stringify({ type: 'presence', payload: msg.payload })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            console.error('[SSE] Error encoding presence:', e);
          }
        };
        
        // Subscribe to heartbeat events
        const onHeartbeat = (msg: any) => {
          try {
            const data = `data: ${JSON.stringify({ type: 'heartbeat', payload: msg.payload })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            console.error('[SSE] Error encoding heartbeat:', e);
          }
        };
        
        // Subscribe to chat events
        const onChat = (msg: any) => {
          try {
            const data = `data: ${JSON.stringify({ type: 'chat', payload: msg.payload })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            console.error('[SSE] Error encoding chat:', e);
          }
        };
        
        // Register all event listeners
        client.on('agent.status', onAgentStatus);
        client.on('session.updated', onSessionUpdated);
        client.on('presence', onPresence);
        client.on('heartbeat', onHeartbeat);
        client.on('chat', onChat);
        
        console.log('[SSE] Event stream started, subscribed to events');
        
        // Keep-alive ping every 30 seconds
        keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': ping\n\n'));
          } catch (e) {
            console.error('[SSE] Keep-alive ping failed:', e);
            if (keepAlive) clearInterval(keepAlive);
          }
        }, 30000);
        
        // Handle client disconnect
        const cleanup = () => {
          if (keepAlive) clearInterval(keepAlive);
          if (client) {
            client.off('agent.status', onAgentStatus);
            client.off('session.updated', onSessionUpdated);
            client.off('presence', onPresence);
            client.off('heartbeat', onHeartbeat);
            client.off('chat', onChat);
          }
          console.log('[SSE] Event stream cleaned up');
        };
        
        // Store cleanup handler
        (controller as any)._cleanup = cleanup;
        
      } catch (error) {
        console.error('[SSE] Error starting event stream:', error);
        if (keepAlive) clearInterval(keepAlive);
        controller.error(error);
      }
    },
    
    cancel() {
      console.log('[SSE] Client disconnected');
      // Call cleanup if available
      if ((this as any)._cleanup) {
        (this as any)._cleanup();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
