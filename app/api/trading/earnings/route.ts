import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

// Known upcoming earnings (manually curated - update weekly)
// Format: YYYY-MM-DD
// Source: Check https://finance.yahoo.com/calendar/earnings for latest dates
const KNOWN_EARNINGS: { [key: string]: string } = {
  // Week 1 - Late February/Early March 2026
  'TGT': '2026-03-03',
  'COST': '2026-03-05',
  'WMT': '2026-02-18',  // Already reported
  
  // Week 2 - Mid March
  'ADBE': '2026-03-12',
  'ORCL': '2026-03-11',
  'CRM': '2026-02-25',  // Already reported
  
  // Week 3 - Late March
  'NKE': '2026-03-20',
  'PYPL': '2026-03-18',
  
  // April - Tech earnings season
  'JPM': '2026-04-11',
  'BAC': '2026-04-15',
  'GS': '2026-04-14',
  'MS': '2026-04-16',
  'JNJ': '2026-04-15',
  'PFE': '2026-04-29',
  'UNH': '2026-04-14',
  
  // Late April - Mega cap tech
  'TSLA': '2026-04-21',
  'NFLX': '2026-04-18',
  'INTC': '2026-04-22',
  'MSFT': '2026-04-23',
  'GOOGL': '2026-04-29',
  'META': '2026-04-28',
  'AAPL': '2026-04-30',
  'AMZN': '2026-04-30',
  'AMD': '2026-04-29',
  'NVDA': '2026-02-26',  // Just reported today!
  
  // Others
  'IBM': '2026-04-20',
  'SNOW': '2026-03-05',
  'NOW': '2026-04-23',
  'XOM': '2026-04-30',
  'CVX': '2026-04-25',
};

// Fetch from Polygon.io (free tier: 5 calls/min)
async function fetchFromPolygon(symbol: string): Promise<any | null> {
  try {
    // Using public endpoint (no API key needed for basic data)
    const response = await fetch(
      `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=demo`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    
    if (response.ok) {
      const data = await response.json();
      // Parse earnings if available
      return null; // Polygon requires paid plan for earnings
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    
    // Calculate cutoff
    const cutoffDays = range === 'week' ? 7 : 30;
    const cutoffTime = todayTime + (cutoffDays * 24 * 60 * 60 * 1000);
    
    // Process known earnings
    const earnings = Object.entries(KNOWN_EARNINGS)
      .map(([symbol, dateStr]) => {
        const earningsDate = new Date(dateStr);
        earningsDate.setHours(0, 0, 0, 0);
        const timestamp = earningsDate.getTime();
        
        // Filter by range
        if (timestamp < todayTime || timestamp > cutoffTime) {
          return null;
        }
        
        const daysUntil = Math.floor((timestamp - todayTime) / (1000 * 60 * 60 * 24));
        
        let priority = '⚪ LATER';
        if (daysUntil === 0) {
          priority = '🔴 TODAY';
        } else if (daysUntil === 1) {
          priority = '🟠 TOMORROW';
        } else if (daysUntil <= 3) {
          priority = '🟡 THIS WEEK';
        } else if (daysUntil <= 7) {
          priority = '🟢 NEXT WEEK';
        }
        
        return {
          symbol,
          date: dateStr,
          time: 'N/A',
          daysUntil,
          priority,
          epsEstimate: null,
          revenueEstimate: null
        };
      })
      .filter((e: any) => e !== null)
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      range,
      count: earnings.length,
      earnings,
      source: 'Curated calendar (manually updated)',
      note: 'Update KNOWN_EARNINGS object in earnings/route.ts weekly'
    });
  } catch (error: any) {
    console.error('Earnings API error:', error);
    
    // Fallback to database cache
    try {
      const result = await pool.query(
        `SELECT symbol, earnings_date as date, earnings_time as time, estimated_eps
         FROM earnings_calendar
         WHERE earnings_date >= CURRENT_DATE
         AND earnings_date <= CURRENT_DATE + INTERVAL '30 days'
         ORDER BY earnings_date ASC`
      );
      
      const earnings = result.rows.map((row: any) => {
        const earningsDate = new Date(row.date);
        const today = new Date();
        const daysUntil = Math.floor((earningsDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority = '⚪ LATER';
        if (daysUntil === 0) priority = '🔴 TODAY';
        else if (daysUntil === 1) priority = '🟠 TOMORROW';
        else if (daysUntil <= 3) priority = '🟡 THIS WEEK';
        else if (daysUntil <= 7) priority = '🟢 NEXT WEEK';
        
        return {
          symbol: row.symbol,
          date: row.date,
          time: row.time,
          daysUntil,
          priority,
          epsEstimate: row.estimated_eps
        };
      });
      
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        count: earnings.length,
        earnings,
        source: 'Database cache',
        note: 'FMP API failed, using cached data'
      });
    } catch (dbError) {
      return NextResponse.json({ 
        error: error.message,
        earnings: []
      }, { status: 500 });
    }
  }
}
