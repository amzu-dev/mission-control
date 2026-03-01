import { NextResponse } from 'next/server';

/**
 * Auto-sync scheduler endpoint
 * Call this from a cron job to intelligently sync data throughout the trading day
 * Respects API quotas and rate limits
 */

export async function POST() {
  try {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getMinutes();
    
    // Trading hours (GMT)
    const isUKSession = currentHour >= 8 && currentHour < 16;
    const isUSSession = currentHour >= 14 && currentHour < 21;
    const isTradingHours = isUKSession || isUSSession;
    
    // Check quota status
    const quotaRes = await fetch('http://localhost:3002/api/trading/quota');
    const quotaData = await quotaRes.json();
    
    if (!quotaData.canSync) {
      return NextResponse.json({
        success: false,
        message: 'Skipped: ' + quotaData.reason,
        nextSyncMinutes: Math.ceil((quotaData.waitMs || 0) / 60000),
      });
    }
    
    // Determine what to sync
    const syncTasks: string[] = [];
    
    // Market data: Every 15 minutes during trading hours, every 30 min outside
    const marketDataInterval = isTradingHours ? 15 : 30;
    if (currentMinute % marketDataInterval === 0) {
      syncTasks.push('market-scan');
    }
    
    // Account snapshot: Every hour
    if (currentMinute === 0) {
      syncTasks.push('account');
    }
    
    // Positions: Every 5 minutes during trading hours
    if (isTradingHours && currentMinute % 5 === 0) {
      syncTasks.push('positions');
    }
    
    if (syncTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sync needed at this time',
        nextCheck: '1 minute',
      });
    }
    
    // Execute sync tasks
    const results = [];
    for (const task of syncTasks) {
      try {
        const res = await fetch('http://localhost:3002/api/trading/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: task }),
        });
        
        const data = await res.json();
        results.push({ task, success: data.success, message: data.message });
        
        // Wait 1 second between tasks to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        results.push({ task, success: false, error: error.message });
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      tradingHours: isTradingHours,
      tasksExecuted: syncTasks.length,
      results,
      quota: {
        used: quotaData.quota.alphaVantage.used,
        remaining: quotaData.quota.alphaVantage.remaining,
        percentUsed: quotaData.quota.alphaVantage.percentUsed,
      },
    });
  } catch (error: any) {
    console.error('Auto-sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET: Status of auto-sync
export async function GET() {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const isUKSession = currentHour >= 8 && currentHour < 16;
  const isUSSession = currentHour >= 14 && currentHour < 21;
  const isTradingHours = isUKSession || isUSSession;
  
  return NextResponse.json({
    currentTime: now.toISOString(),
    currentHourGMT: currentHour,
    isUKSession,
    isUSSession,
    isTradingHours,
    schedule: {
      marketData: isTradingHours ? 'Every 15 min' : 'Every 30 min',
      positions: isTradingHours ? 'Every 5 min' : 'Paused',
      account: 'Every hour',
    },
    quotaLimits: {
      alphaVantage: '500 calls/day, 5 calls/min',
      finnhub: '60 calls/min',
      yfinance: 'Unlimited',
    },
  });
}
