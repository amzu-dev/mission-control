import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
  try {
    // Get account status
    const accountResult = await pool.query(`
      SELECT * FROM v_account_status 
      WHERE account_id = '309389790235337758'
    `);
    
    // Get trading performance
    const perfResult = await pool.query(`
      SELECT * FROM v_trading_performance 
      WHERE account_id = '309389790235337758'
    `);
    
    // Get recent trades
    const tradesResult = await pool.query(`
      SELECT * FROM trades 
      WHERE account_id = '309389790235337758'
      ORDER BY entry_time DESC 
      LIMIT 20
    `);
    
    // Get strategy rules
    const rulesResult = await pool.query(`
      SELECT * FROM strategy_rules 
      WHERE enabled = true 
      ORDER BY priority ASC
    `);
    
    // Get lessons learned
    const lessonsResult = await pool.query(`
      SELECT * FROM lessons_learned 
      ORDER BY lesson_date DESC 
      LIMIT 10
    `);
    
    return NextResponse.json({
      account: accountResult.rows[0] || null,
      performance: perfResult.rows[0] || null,
      recentTrades: tradesResult.rows,
      rules: rulesResult.rows,
      lessons: lessonsResult.rows
    });
  } catch (error: any) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
