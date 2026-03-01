import { OpenClawClient, loadOpenClawIdentity } from 'openclaw-ws-client';

let client: OpenClawClient | null = null;
let connectionPromise: Promise<OpenClawClient> | null = null;

/**
 * Get or create a singleton WebSocket client connection to OpenClaw Gateway
 * @returns Connected OpenClaw client instance
 */
export async function getOpenClawClient(): Promise<OpenClawClient> {
  // Return existing connected client
  if (client && client.isConnected()) {
    return client;
  }
  
  // Wait for in-progress connection
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // Create new connection
  connectionPromise = (async () => {
    try {
      const identity = await loadOpenClawIdentity();
      
      const newClient = new OpenClawClient({
        gatewayUrl: 'ws://127.0.0.1:18789',
        ...identity
      });
      
      // Set up error handler
      newClient.onError((error) => {
        console.error('[OpenClaw Client] Error:', error.message);
      });
      
      // Set up close handler
      newClient.onClose((code, reason) => {
        console.warn(`[OpenClaw Client] Disconnected: ${code} - ${reason}`);
        client = null;
        connectionPromise = null;
      });
      
      // Enable auto-reconnect
      newClient.setReconnect(true, 3000);
      
      await newClient.connect();
      console.log('[OpenClaw Client] Connected to Gateway');
      
      client = newClient;
      connectionPromise = null;
      
      return newClient;
    } catch (error) {
      connectionPromise = null;
      console.error('[OpenClaw Client] Failed to connect:', error);
      throw new Error(`Failed to connect to OpenClaw Gateway: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })();
  
  return connectionPromise;
}

/**
 * Disconnect and cleanup the WebSocket client
 */
export function disconnectClient(): void {
  if (client) {
    client.disconnect();
    client = null;
  }
  connectionPromise = null;
}

/**
 * Check if client is currently connected
 */
export function isClientConnected(): boolean {
  return client !== null && client.isConnected();
}
