import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

// Save market data snapshot
export async function POST(request: Request) {
  try {
    const { symbol, instrumentType, price, bid, ask, volume, changePct, rsi, ema9, ema21 } = await request.json();
    
    const result = await pool.query(
      `INSERT INTO market_data 
       (symbol, instrument_type, price, bid, ask, volume, change_pct, rsi, ema_9, ema_21, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
       RETURNING *`,
      [symbol, instrumentType, price, bid, ask, volume, changePct, rsi, ema9, ema21]
    );
    
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error saving market data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get historical market data for charts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'CRM';
    const period = searchParams.get('period') || '1d'; // 1d, 1w, 1m, 3m
    
    // Calculate time range
    let hoursBack = 24;
    if (period === '1w') hoursBack = 168;
    if (period === '1m') hoursBack = 720;
    if (period === '3m') hoursBack = 2160;
    
    const result = await pool.query(
      `SELECT 
        symbol,
        price,
        volume,
        rsi,
        timestamp
       FROM market_data 
       WHERE symbol = $1 
         AND timestamp > NOW() - INTERVAL '${hoursBack} hours'
       ORDER BY timestamp ASC`,
      [symbol]
    );
    
    return NextResponse.json({ 
      symbol,
      period,
      data: result.rows 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
