import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

/**
 * Trading Wolf Watchlist Manager
 * 
 * Two-tier system:
 * 1. CORE (Trading Wolf 10) - Stable, high-quality stocks for long-term edge
 * 2. VOLATILE (Hot List) - Daily rotating stocks based on earnings/news/momentum
 */

// Stock universe to analyze
const STOCK_UNIVERSE = [
  // Mega-cap tech
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
  // SaaS/Cloud
  'CRM', 'SNOW', 'ORCL', 'ADBE', 'NOW',
  // Finance
  'JPM', 'BAC', 'GS', 'MS', 'V', 'MA',
  // Healthcare
  'UNH', 'JNJ', 'PFE', 'ABBV', 'LLY',
  // Consumer
  'WMT', 'TGT', 'COST', 'HD', 'NKE',
  // Energy
  'XOM', 'CVX',
  // Entertainment
  'NFLX', 'DIS',
  // Semiconductors
  'AMD', 'INTC', 'QCOM', 'AVGO',
  // E-commerce
  'SHOP', 'BABA',
  // Other
  'IBM', 'PYPL', 'SQ', 'UBER'
];

interface StockScore {
  symbol: string;
  name: string;
  sector: string;
  score: number;
  reasons: string[];
  volatility: number;
  volume: number;
  performance30d: number;
  earningsUpcoming: boolean;
  newsSentiment: string;
}

// Scoring criteria for CORE watchlist
async function scoreCoreStock(symbol: string): Promise<StockScore | null> {
  try {
    // Fetch from Yahoo Finance
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    const quote = result?.meta;
    
    if (!quote) return null;
    
    // Get historical data for 30-day performance
    const closes = result.indicators?.quote?.[0]?.close?.filter((c: any) => c !== null) || [];
    const performance30d = closes.length >= 2 
      ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 
      : 0;
    
    // Calculate volatility (simplified: price range / avg price)
    const highs = result.indicators?.quote?.[0]?.high?.filter((h: any) => h !== null) || [];
    const lows = result.indicators?.quote?.[0]?.low?.filter((l: any) => l !== null) || [];
    const avgHigh = highs.reduce((a: number, b: number) => a + b, 0) / highs.length;
    const avgLow = lows.reduce((a: number, b: number) => a + b, 0) / lows.length;
    const avgPrice = (avgHigh + avgLow) / 2;
    const volatility = avgPrice > 0 ? ((avgHigh - avgLow) / avgPrice) * 100 : 0;
    
    // Scoring logic for CORE
    let score = 50; // Base score
    const reasons: string[] = [];
    
    // Market cap (prefer large cap for stability)
    const marketCap = quote.marketCap || 0;
    if (marketCap > 100e9) { 
      score += 20; 
      reasons.push('Large cap (>$100B)');
    } else if (marketCap > 10e9) { 
      score += 10; 
      reasons.push('Mid cap ($10B-$100B)');
    }
    
    // Volatility (lower is better for CORE)
    if (volatility < 2) {
      score += 15;
      reasons.push('Low volatility (<2%)');
    } else if (volatility < 3) {
      score += 10;
      reasons.push('Moderate volatility');
    } else {
      score -= 5;
      reasons.push('High volatility');
    }
    
    // Performance (positive momentum)
    if (performance30d > 5) {
      score += 10;
      reasons.push('Strong 30d performance (>+5%)');
    } else if (performance30d > 0) {
      score += 5;
      reasons.push('Positive 30d momentum');
    } else if (performance30d < -10) {
      score -= 10;
      reasons.push('Weak 30d performance');
    }
    
    // Volume (prefer liquid stocks)
    const avgVolume = quote.averageDailyVolume10Day || 0;
    if (avgVolume > 10e6) {
      score += 10;
      reasons.push('High liquidity (>10M vol)');
    } else if (avgVolume > 1e6) {
      score += 5;
    }
    
    return {
      symbol,
      name: quote.symbol || symbol,
      sector: quote.sector || 'Unknown',
      score,
      reasons,
      volatility,
      volume: avgVolume,
      performance30d,
      earningsUpcoming: false, // Will update separately
      newsSentiment: 'neutral'
    };
  } catch (error) {
    console.error(`Error scoring ${symbol}:`, error);
    return null;
  }
}

// Scoring criteria for VOLATILE watchlist
async function scoreVolatileStock(symbol: string): Promise<StockScore | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    const quote = result?.meta;
    
    if (!quote) return null;
    
    // Get 5-day performance for momentum
    const closes = result.indicators?.quote?.[0]?.close?.filter((c: any) => c !== null) || [];
    const performance5d = closes.length >= 2 
      ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 
      : 0;
    
    // Calculate intraday volatility
    const highs = result.indicators?.quote?.[0]?.high?.filter((h: any) => h !== null) || [];
    const lows = result.indicators?.quote?.[0]?.low?.filter((l: any) => l !== null) || [];
    const avgHigh = highs.reduce((a: number, b: number) => a + b, 0) / highs.length;
    const avgLow = lows.reduce((a: number, b: number) => a + b, 0) / lows.length;
    const avgPrice = (avgHigh + avgLow) / 2;
    const volatility = avgPrice > 0 ? ((avgHigh - avgLow) / avgPrice) * 100 : 0;
    
    // Scoring logic for VOLATILE (opposite of CORE - want movement!)
    let score = 50;
    const reasons: string[] = [];
    
    // High volatility is GOOD for trading
    if (volatility > 5) {
      score += 20;
      reasons.push('Excellent volatility (>5%)');
    } else if (volatility > 3) {
      score += 15;
      reasons.push('High volatility (>3%)');
    } else if (volatility < 2) {
      score -= 10;
      reasons.push('Too stable for trading');
    }
    
    // Strong recent momentum
    if (Math.abs(performance5d) > 10) {
      score += 20;
      reasons.push(`Extreme 5d move (${performance5d > 0 ? '+' : ''}${performance5d.toFixed(1)}%)`);
    } else if (Math.abs(performance5d) > 5) {
      score += 15;
      reasons.push('Strong 5d momentum');
    }
    
    // Volume spike detection
    const avgVolume = quote.averageDailyVolume10Day || 0;
    const currentVolume = quote.regularMarketVolume || 0;
    if (currentVolume > avgVolume * 2) {
      score += 15;
      reasons.push('Volume spike (2x average)');
    } else if (currentVolume > avgVolume * 1.5) {
      score += 10;
      reasons.push('High volume (1.5x average)');
    }
    
    return {
      symbol,
      name: quote.symbol || symbol,
      sector: quote.sector || 'Unknown',
      score,
      reasons,
      volatility,
      volume: avgVolume,
      performance30d: performance5d,
      earningsUpcoming: false,
      newsSentiment: 'neutral'
    };
  } catch (error) {
    console.error(`Error scoring volatile ${symbol}:`, error);
    return null;
  }
}

// Main analysis function
async function analyzeAndUpdateWatchlists() {
  const results: any = {
    core: {
      analyzed: 0,
      added: 0,
      removed: 0,
      scores: [] as StockScore[]
    },
    volatile: {
      analyzed: 0,
      added: 0,
      removed: 0,
      scores: [] as StockScore[]
    }
  };
  
  // Score all stocks for CORE
  console.log('🔍 Analyzing stocks for CORE watchlist...');
  for (const symbol of STOCK_UNIVERSE) {
    const score = await scoreCoreStock(symbol);
    if (score) {
      results.core.scores.push(score);
      results.core.analyzed++;
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
  }
  
  // Score all stocks for VOLATILE
  console.log('🔍 Analyzing stocks for VOLATILE watchlist...');
  for (const symbol of STOCK_UNIVERSE) {
    const score = await scoreVolatileStock(symbol);
    if (score) {
      results.volatile.scores.push(score);
      results.volatile.analyzed++;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Sort by score
  results.core.scores.sort((a, b) => b.score - a.score);
  results.volatile.scores.sort((a, b) => b.score - a.score);
  
  // Update database - CORE (Top 10)
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Deactivate old CORE watchlist
    await client.query(`UPDATE watchlist SET active = false WHERE tier = 'core'`);
    
    // Add new top 10 for CORE
    const top10Core = results.core.scores.slice(0, 10);
    for (const stock of top10Core) {
      await client.query(
        `INSERT INTO watchlist (symbol, tier, name, sector, reason, score, volatility, avg_volume, performance_30d, active)
         VALUES ($1, 'core', $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (symbol, tier) 
         DO UPDATE SET 
           score = $5, 
           volatility = $6, 
           performance_30d = $8, 
           reason = $4, 
           active = true, 
           last_reviewed = CURRENT_DATE`,
        [stock.symbol, stock.name, stock.sector, stock.reasons.join('; '), 
         stock.score, stock.volatility, stock.volume, stock.performance30d]
      );
      
      // Log to history
      await client.query(
        `INSERT INTO watchlist_history (symbol, tier, action, reason, score)
         VALUES ($1, 'core', 'reviewed', $2, $3)`,
        [stock.symbol, `Score: ${stock.score} - ${stock.reasons[0]}`, stock.score]
      );
      
      results.core.added++;
    }
    
    // Update VOLATILE (Top 10)
    await client.query(`UPDATE watchlist SET active = false WHERE tier = 'volatile'`);
    
    const top10Volatile = results.volatile.scores.slice(0, 10);
    for (const stock of top10Volatile) {
      await client.query(
        `INSERT INTO watchlist (symbol, tier, name, sector, reason, score, volatility, avg_volume, performance_30d, active)
         VALUES ($1, 'volatile', $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (symbol, tier) 
         DO UPDATE SET 
           score = $5, 
           volatility = $6, 
           performance_30d = $8, 
           reason = $4, 
           active = true, 
           last_reviewed = CURRENT_DATE`,
        [stock.symbol, stock.name, stock.sector, stock.reasons.join('; '), 
         stock.score, stock.volatility, stock.volume, stock.performance30d]
      );
      
      await client.query(
        `INSERT INTO watchlist_history (symbol, tier, action, reason, score)
         VALUES ($1, 'volatile', 'reviewed', $2, $3)`,
        [stock.symbol, `Score: ${stock.score} - ${stock.reasons[0]}`, stock.score]
      );
      
      results.volatile.added++;
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  
  return results;
}

// GET: View current watchlists
export async function GET() {
  try {
    const coreResult = await pool.query(
      `SELECT * FROM watchlist 
       WHERE tier = 'core' AND active = true 
       ORDER BY score DESC`
    );
    
    const volatileResult = await pool.query(
      `SELECT * FROM watchlist 
       WHERE tier = 'volatile' AND active = true 
       ORDER BY score DESC`
    );
    
    return NextResponse.json({
      core: {
        count: coreResult.rows.length,
        stocks: coreResult.rows
      },
      volatile: {
        count: volatileResult.rows.length,
        stocks: volatileResult.rows
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Run analysis and update watchlists
export async function POST() {
  try {
    console.log('🐺 Trading Wolf - Watchlist Manager Started');
    const results = await analyzeAndUpdateWatchlists();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Watchlists updated successfully',
      results: {
        core: {
          analyzed: results.core.analyzed,
          top10: results.core.scores.slice(0, 10).map((s: StockScore) => ({
            symbol: s.symbol,
            score: s.score,
            reason: s.reasons[0]
          }))
        },
        volatile: {
          analyzed: results.volatile.analyzed,
          top10: results.volatile.scores.slice(0, 10).map((s: StockScore) => ({
            symbol: s.symbol,
            score: s.score,
            reason: s.reasons[0]
          }))
        }
      }
    });
  } catch (error: any) {
    console.error('Watchlist manager error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
