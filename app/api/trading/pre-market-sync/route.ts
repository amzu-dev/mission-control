import { NextResponse } from 'next/server';

/**
 * Pre-Market Sync
 * Run this before trading sessions to ensure fresh data
 * - UK Session: Run at 07:45 GMT
 * - US Session: Run at 14:15 GMT
 */

export async function POST() {
  try {
    const results = [];
    
    // 1. Sync market data (stocks + forex)
    console.log('🔄 Pre-market: Syncing market data...');
    const marketRes = await fetch('http://localhost:3002/api/trading/market-scan');
    const marketData = await marketRes.json();
    results.push({
      task: 'market-data',
      success: marketRes.ok,
      stocksUpdated: marketData.stocks?.length || 0,
      forexUpdated: marketData.forex?.length || 0
    });
    
    // 2. Sync positions
    console.log('🔄 Pre-market: Syncing positions...');
    const posRes = await fetch('http://localhost:3002/api/trading/positions');
    const posData = await posRes.json();
    results.push({
      task: 'positions',
      success: posRes.ok,
      positionsUpdated: posData.positions?.length || 0
    });
    
    // 3. Sync account snapshot
    console.log('🔄 Pre-market: Syncing account...');
    const accRes = await fetch('http://localhost:3002/api/trading/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'account' })
    });
    const accData = await accRes.json();
    results.push({
      task: 'account-snapshot',
      success: accData.success || false
    });
    
    // 4. Check earnings today
    console.log('🔄 Pre-market: Checking earnings...');
    const earningsRes = await fetch('http://localhost:3002/api/trading/earnings');
    const earningsData = await earningsRes.json();
    results.push({
      task: 'earnings-calendar',
      success: earningsRes.ok,
      earningsToday: earningsData.earnings?.filter((e: any) => 
        e.priority && e.priority.includes('TODAY')
      ).length || 0
    });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Pre-market sync complete',
      results,
      summary: {
        totalTasks: results.length,
        successfulTasks: results.filter(r => r.success).length,
        stocksReady: results[0].stocksUpdated || 0,
        positionsReady: results[1].positionsUpdated || 0,
        earningsToday: results[3]?.earningsToday || 0
      }
    });
  } catch (error: any) {
    console.error('Pre-market sync error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET: Check if pre-market sync is needed
export async function GET() {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getMinutes();
  
  // UK Pre-market: 07:45 GMT
  const isUKPreMarket = currentHour === 7 && currentMinute >= 45;
  
  // US Pre-market: 14:15 GMT
  const isUSPreMarket = currentHour === 14 && currentMinute >= 15 && currentMinute < 30;
  
  const shouldSync = isUKPreMarket || isUSPreMarket;
  
  return NextResponse.json({
    currentTime: now.toISOString(),
    currentHourGMT: currentHour,
    currentMinuteGMT: currentMinute,
    shouldSync,
    nextSyncTimes: {
      ukPreMarket: '07:45 GMT (before UK open at 08:00)',
      usPreMarket: '14:15 GMT (before US open at 14:30)'
    }
  });
}
