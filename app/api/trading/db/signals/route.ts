import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

// Save trading signal
export async function POST(request: Request) {
  try {
    const { symbol, signalType, direction, price, rsi, strength, notes } = await request.json();
    
    const result = await pool.query(
      `INSERT INTO trading_signals 
       (symbol, signal_type, direction, price, rsi, strength, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING *`,
      [symbol, signalType, direction, price, rsi, strength, notes]
    );
    
    return NextResponse.json({ success: true, signal: result.rows[0] });
  } catch (error: any) {
    console.error('Error saving signal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get recent signals
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const actioned = searchParams.get('actioned');
    
    let query = `
      SELECT * FROM trading_signals 
      WHERE 1=1
    `;
    
    if (actioned !== null) {
      query += ` AND actioned = ${actioned === 'true'}`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await pool.query(query);
    
    return NextResponse.json({ signals: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
