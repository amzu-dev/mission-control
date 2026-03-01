'use client';

import { useRealtimeEvents } from '@/app/hooks/useRealtimeEvents';

export function LiveIndicator() {
  const { connected } = useRealtimeEvents();
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700">
      <div
        className={`w-2 h-2 rounded-full transition-colors ${
          connected
            ? 'bg-green-400 animate-pulse'
            : 'bg-gray-500'
        }`}
      />
      <span className="text-xs font-medium text-gray-300">
        {connected ? 'Live' : 'Connecting...'}
      </span>
    </div>
  );
}
