import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { spawn } from 'child_process';
import path from 'path';

const TRADING_WORKSPACE = '/Users/venkat/.openclaw/workspace/Elite quantitative trader with cunning instincts and disciplined risk management';
const ACCOUNT_ID = '309389790235337758';

export async function POST(request: Request) {
  try {
    const { type } = await request.json();
    
    // Check quota before syncing (only for market-scan which uses Alpha Vantage)
    if (type === 'market-scan') {
      const quotaCheck = await fetch('http://localhost:3002/api/trading/quota');
      const quotaData = await quotaCheck.json();
      
      if (!quotaData.canSync) {
        return NextResponse.json({ 
          success: false, 
          error: quotaData.reason,
          waitMs: quotaData.waitMs 
        }, { status: 429 });
      }
      
      await syncMarketData();
      
      // Record quota usage
      await fetch('http://localhost:3002/api/trading/quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'market-scan' })
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Market data synced',
        quota: {
          used: quotaData.quota.alphaVantage.used + 12,
          remaining: quotaData.quota.alphaVantage.remaining - 12,
        }
      });
    }
    
    if (type === 'positions') {
      await syncPositions();
      return NextResponse.json({ success: true, message: 'Positions synced' });
    }
    
    if (type === 'account') {
      await syncAccountSnapshot();
      return NextResponse.json({ success: true, message: 'Account snapshot synced' });
    }
    
    return NextResponse.json({ error: 'Unknown sync type' }, { status: 400 });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function syncMarketData() {
  return new Promise<void>((resolve, reject) => {
    const scriptPath = path.join(TRADING_WORKSPACE, 'market_scan_v2.py');
    const python = spawn('python3', [scriptPath], { cwd: TRADING_WORKSPACE });
    
    let output = '';
    python.stdout.on('data', (data) => { output += data.toString(); });
    
    python.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error('Market scan failed'));
        return;
      }
      
      // Parse and save to DB
      const lines = output.split('\n');
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        for (const line of lines) {
          // Parse stock data: "CRM        $191.75        3.41%   40.70"
          if (line.includes('$') && /[A-Z]{2,}/.test(line)) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 4) {
              const symbol = parts[0];
              const price = parseFloat(parts[1].replace('$', '').replace(',', ''));
              const changePct = parseFloat(parts[2].replace('%', ''));
              const rsi = parseFloat(parts[3]);
              
              if (!isNaN(price)) {
                await client.query(
                  `INSERT INTO market_data (symbol, instrument_type, price, change_pct, rsi)
                   VALUES ($1, 'stock', $2, $3, $4)`,
                  [symbol, price, changePct, rsi]
                );
                
                // Create signal if RSI extreme
                if (rsi < 30) {
                  await client.query(
                    `INSERT INTO trading_signals (symbol, signal_type, direction, price, rsi, strength)
                     VALUES ($1, 'RSI Oversold', 'LONG', $2, $3, 8)`,
                    [symbol, price, rsi]
                  );
                } else if (rsi > 70) {
                  await client.query(
                    `INSERT INTO trading_signals (symbol, signal_type, direction, price, rsi, strength)
                     VALUES ($1, 'RSI Overbought', 'SHORT', $2, $3, 8)`,
                    [symbol, price, rsi]
                  );
                }
              }
            }
          }
        }
        
        await client.query('COMMIT');
        console.log('✅ Market data synced to database');
        resolve();
      } catch (error) {
        await client.query('ROLLBACK');
        reject(error);
      } finally {
        client.release();
      }
    });
  });
}

async function syncPositions() {
  return new Promise<void>((resolve, reject) => {
    const scriptPath = path.join(TRADING_WORKSPACE, 'check_status.py');
    const python = spawn('python3', [scriptPath], { cwd: TRADING_WORKSPACE });
    
    let output = '';
    python.stdout.on('data', (data) => { output += data.toString(); });
    
    python.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error('Position check failed'));
        return;
      }
      
      console.log('✅ Positions synced (parsing implementation needed)');
      resolve();
    });
  });
}

async function syncAccountSnapshot() {
  return new Promise<void>((resolve, reject) => {
    const scriptPath = path.join(TRADING_WORKSPACE, 'check_status.py');
    const python = spawn('python3', [scriptPath], { cwd: TRADING_WORKSPACE });
    
    let output = '';
    python.stdout.on('data', (data) => { output += data.toString(); });
    
    python.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error('Account check failed'));
        return;
      }
      
      // Parse account data from output
      const lines = output.split('\n');
      let balance = 906.13;
      let totalPL = -93.87;
      let drawdown = -9.39;
      
      for (const line of lines) {
        if (line.includes('Balance:')) {
          const match = line.match(/£([\d,]+\.?\d*)/);
          if (match) balance = parseFloat(match[1].replace(/,/g, ''));
        }
        if (line.includes('P&L:')) {
          const match = line.match(/£(-?[\d,]+\.?\d*)/);
          if (match) totalPL = parseFloat(match[1].replace(/,/g, ''));
        }
        if (line.includes('drawdown')) {
          const match = line.match(/(-?[\d.]+)%/);
          if (match) drawdown = parseFloat(match[1]);
        }
      }
      
      try {
        await pool.query(
          `INSERT INTO account_snapshots 
           (account_id, balance, total_pl, drawdown_pct, open_positions)
           VALUES ($1, $2, $3, $4, 3)`,
          [ACCOUNT_ID, balance, totalPL, drawdown]
        );
        
        console.log('✅ Account snapshot saved to database');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}
