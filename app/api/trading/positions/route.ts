import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import pool from '@/app/lib/db';

const TRADING_WORKSPACE = '/Users/venkat/.openclaw/workspace/Elite quantitative trader with cunning instincts and disciplined risk management';
const ACCOUNT_ID = '309389790235337758';

export async function GET() {
  return new Promise((resolve) => {
    const scriptPath = path.join(TRADING_WORKSPACE, 'check_status.py');
    
    const python = spawn('python3', [scriptPath], {
      cwd: TRADING_WORKSPACE
    });

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', async (code) => {
      if (code !== 0) {
        resolve(NextResponse.json({ 
          error: 'Script failed', 
          details: errorOutput 
        }, { status: 500 }));
        return;
      }

      // Parse the output
      const lines = output.split('\n');
      let balance = 0;
      let totalPL = 0;
      let available = 0;
      const positions: any[] = [];
      
      let currentPosition: any = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Parse balance
        if (line.includes('Balance:')) {
          const match = line.match(/£([\d,]+\.?\d*)/);
          if (match) balance = parseFloat(match[1].replace(/,/g, ''));
        }
        
        // Parse P&L
        if (line.includes('P&L:')) {
          const match = line.match(/£(-?[\d,]+\.?\d*)/);
          if (match) totalPL = parseFloat(match[1].replace(/,/g, ''));
        }
        
        // Parse available
        if (line.includes('Available:')) {
          const match = line.match(/£([\d,]+\.?\d*)/);
          if (match) available = parseFloat(match[1].replace(/,/g, ''));
        }
        
        // Parse positions - Format:
        // USD/JPY SELL
        // Entry: 156.057 | Now: 156.121
        // UPL: £-0.04
        if (line.includes('BUY') || line.includes('SELL')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            currentPosition = {
              symbol: parts[0],
              direction: parts[1] === 'BUY' ? 'LONG' : 'SHORT',
              entry: '',
              current: '',
              pl: '',
              stop: ''
            };
          }
        } else if (currentPosition && line.includes('Entry:')) {
          // Entry: 156.057 | Now: 156.121
          const entryMatch = line.match(/Entry:\s*([\d.]+)/);
          const nowMatch = line.match(/Now:\s*([\d.]+)/);
          if (entryMatch) currentPosition.entry = entryMatch[1];
          if (nowMatch) currentPosition.current = nowMatch[1];
        } else if (currentPosition && line.includes('UPL:')) {
          // UPL: £-0.04
          const uplMatch = line.match(/£(-?[\d.]+)/);
          if (uplMatch) {
            currentPosition.pl = uplMatch[1];
            positions.push(currentPosition);
            currentPosition = null;
          }
        }
      }
      
      // Calculate drawdown (updated baseline after £10k top-up)
      const initialBalance = 10893.59; // Starting balance (Feb 26 reset)
      const drawdown = ((balance - initialBalance) / initialBalance) * 100;
      
      // Save account snapshot to database
      try {
        await pool.query(
          `INSERT INTO account_snapshots 
           (account_id, balance, total_pl, drawdown_pct, open_positions)
           VALUES ($1, $2, $3, $4, $5)`,
          [ACCOUNT_ID, balance, totalPL, drawdown, positions.length]
        ).catch(() => {}); // Ignore errors
      } catch (error) {
        console.error('Error saving snapshot:', error);
      }

      resolve(NextResponse.json({
        timestamp: new Date().toISOString(),
        account: {
          balance,
          totalPL,
          drawdown,
          available,
          positionCount: positions.length
        },
        positions,
        source: 'Capital.com API'
      }));
    });
  });
}
