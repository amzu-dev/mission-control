import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function POST(request: Request) {
  try {
    const { accountId, balance, equity, totalPL, drawdown, openPositions } = await request.json();
    
    const result = await pool.query(
      `INSERT INTO account_snapshots 
       (account_id, balance, equity, total_pl, drawdown_pct, open_positions, snapshot_time)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (account_id, snapshot_time) DO UPDATE 
       SET balance = $2, equity = $3, total_pl = $4, drawdown_pct = $5, open_positions = $6
       RETURNING *`,
      [accountId, balance, equity, totalPL, drawdown, openPositions]
    );
    
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error saving account snapshot:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT * FROM account_snapshots 
       WHERE account_id = '309389790235337758'
       ORDER BY snapshot_time DESC 
       LIMIT 100`
    );
    
    return NextResponse.json({ snapshots: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
