import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

// API Quota Limits (free tiers)
const QUOTAS = {
  alphaVantage: {
    dailyLimit: 500,
    perMinuteLimit: 5,
    costPerScan: 12, // 12 stocks scanned
  },
  finnhub: {
    perMinuteLimit: 60,
    costPerNews: 1,
  },
  yfinance: {
    unlimited: true,
  },
};

// Trading day schedule (GMT)
const TRADING_HOURS = {
  ukOpen: 8,    // 08:00
  ukClose: 16,  // 16:30 (we'll use 16 for simplicity)
  usOpen: 14,   // 14:30 (we'll use 14)
  usClose: 21,  // 21:00
};

interface QuotaUsage {
  date: string;
  alphaVantageCalls: number;
  finnhubCalls: number;
  lastSyncTime: string | null;
  nextSyncTime: string | null;
}

// Get or create today's quota usage
async function getTodayQuota(): Promise<QuotaUsage> {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await pool.query(
    `SELECT * FROM quota_usage WHERE date = $1`,
    [today]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  
  // Create new entry for today
  await pool.query(
    `INSERT INTO quota_usage (date, alpha_vantage_calls, finnhub_calls)
     VALUES ($1, 0, 0)`,
    [today]
  );
  
  return {
    date: today,
    alphaVantageCalls: 0,
    finnhubCalls: 0,
    lastSyncTime: null,
    nextSyncTime: null,
  };
}

// Calculate optimal sync interval
function calculateSyncInterval(): number {
  const now = new Date();
  const currentHour = now.getUTCHours();
  
  // Not during trading hours - sync every 30 minutes
  if (currentHour < TRADING_HOURS.ukOpen || currentHour > TRADING_HOURS.usClose) {
    return 30 * 60 * 1000; // 30 minutes
  }
  
  // During trading hours - calculate based on quota
  const remainingHours = TRADING_HOURS.usClose - currentHour;
  const targetScans = Math.floor(QUOTAS.alphaVantage.dailyLimit / QUOTAS.alphaVantage.costPerScan);
  const scansPerHour = Math.floor(targetScans / 13); // 13 hours of trading
  
  // Every 15-20 minutes during active trading
  return 15 * 60 * 1000; // 15 minutes
}

// Check if sync is allowed (respects rate limits)
async function canSync(): Promise<{ allowed: boolean; reason?: string; waitMs?: number }> {
  const quota = await getTodayQuota();
  const now = new Date();
  
  // Check daily limit
  if (quota.alphaVantageCalls >= QUOTAS.alphaVantage.dailyLimit) {
    return {
      allowed: false,
      reason: 'Daily Alpha Vantage quota exhausted (500/500 calls)',
    };
  }
  
  // Check if last sync was too recent (rate limit)
  if (quota.lastSyncTime) {
    const lastSync = new Date(quota.lastSyncTime);
    const timeSinceLastSync = now.getTime() - lastSync.getTime();
    const minInterval = 3 * 60 * 1000; // 3 minutes minimum (5 calls/min limit × 12 stocks / 60s)
    
    if (timeSinceLastSync < minInterval) {
      const waitMs = minInterval - timeSinceLastSync;
      return {
        allowed: false,
        reason: `Rate limit: Wait ${Math.ceil(waitMs / 1000)}s before next sync`,
        waitMs,
      };
    }
  }
  
  return { allowed: true };
}

// Record sync usage
async function recordSync(type: 'market-scan' | 'positions' | 'account'): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();
  
  if (type === 'market-scan') {
    await pool.query(
      `UPDATE quota_usage 
       SET alpha_vantage_calls = alpha_vantage_calls + $1,
           last_sync_time = $2
       WHERE date = $3`,
      [QUOTAS.alphaVantage.costPerScan, now, today]
    );
  }
}

// GET: Check quota status
export async function GET() {
  try {
    const quota = await getTodayQuota();
    const canSyncResult = await canSync();
    const syncInterval = calculateSyncInterval();
    
    const remaining = QUOTAS.alphaVantage.dailyLimit - quota.alphaVantageCalls;
    const percentUsed = (quota.alphaVantageCalls / QUOTAS.alphaVantage.dailyLimit) * 100;
    
    return NextResponse.json({
      quota: {
        alphaVantage: {
          used: quota.alphaVantageCalls,
          limit: QUOTAS.alphaVantage.dailyLimit,
          remaining,
          percentUsed: Math.round(percentUsed),
        },
        finnhub: {
          used: quota.finnhubCalls,
          limit: 'unlimited',
          rateLimit: '60/min',
        },
      },
      canSync: canSyncResult.allowed,
      reason: canSyncResult.reason,
      waitMs: canSyncResult.waitMs,
      lastSyncTime: quota.lastSyncTime,
      recommendedInterval: syncInterval,
      recommendedIntervalMinutes: Math.round(syncInterval / 60000),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Record sync
export async function POST(request: Request) {
  try {
    const { type } = await request.json();
    await recordSync(type);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
