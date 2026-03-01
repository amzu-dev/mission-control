'use client';

import { useEffect, useState } from 'react';

interface RealtimeEvent {
  type: string;
  payload?: any;
}

export function useRealtimeEvents() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connect = () => {
      eventSource = new EventSource('/api/events');
      
      eventSource.onopen = () => {
        console.log('[Realtime] Connected to event stream');
        setConnected(true);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);
          setEvents(prev => [...prev.slice(-99), data]); // Keep last 100 events
        } catch (err) {
          console.error('[Realtime] Failed to parse event:', err);
        }
      };
      
      eventSource.onerror = () => {
        console.warn('[Realtime] Connection lost, reconnecting...');
        setConnected(false);
        eventSource?.close();
        
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };
    
    connect();
    
    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);
  
  return { connected, events, lastEvent };
}
