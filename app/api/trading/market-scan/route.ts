import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

const STOCKS = ['CRM', 'NVDA', 'META', 'TSLA', 'NFLX', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'ORCL', 'IBM', 'SNOW'];

// Use yfinance directly via Node.js (no Python, no rate limits)
async function fetchStockData() {
  const stocks: any[] = [];
  
  for (const symbol of STOCKS) {
    try {
      // Query recent data from database first
      const dbResult = await pool.query(
        `SELECT * FROM market_data 
         WHERE symbol = $1 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [symbol]
      );
      
      if (dbResult.rows.length > 0 && 
          new Date().getTime() - new Date(dbResult.rows[0].timestamp).getTime() < 60000) {
        // Use cached data if less than 1 minute old
        const row = dbResult.rows[0];
        stocks.push({
          symbol: row.symbol,
          price: `$${parseFloat(row.price).toFixed(2)}`,
          change: `${parseFloat(row.change_pct).toFixed(2)}%`,
          rsi: row.rsi ? parseFloat(row.rsi).toFixed(2) : 'N/A'
        });
        continue;
      }
      
      // Fetch fresh data from yfinance API (Yahoo Finance public endpoint)
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const result = data.chart?.result?.[0];
      const quote = result?.meta;
      
      if (quote) {
        // Get current price
        let price = quote.regularMarketPrice;
        if (!price || isNaN(price)) {
          // Fallback to last close price
          const closes = result.indicators?.quote?.[0]?.close?.filter((c: any) => c !== null && !isNaN(c)) || [];
          if (closes.length > 0) {
            price = closes[closes.length - 1];
          }
        }
        
        // Get previous close
        let previousClose = quote.chartPreviousClose || quote.previousClose;
        
        // Calculate change %
        let changePct = 0;
        if (price && previousClose && !isNaN(price) && !isNaN(previousClose) && previousClose > 0) {
          changePct = ((price - previousClose) / previousClose) * 100;
        }
        
        if (price && !isNaN(price)) {
          stocks.push({
            symbol,
            price: `$${price.toFixed(2)}`,
            change: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
            rsi: 'N/A',
            priceNum: price,
            changePctNum: changePct
          });
        
          // Save to database
          await pool.query(
            `INSERT INTO market_data (symbol, instrument_type, price, change_pct, timestamp)
             VALUES ($1, 'stock', $2, $3, CURRENT_TIMESTAMP)`,
            [symbol, price, changePct]
          ).catch(() => {}); // Ignore errors
        }
      }
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
    }
  }
  
  return stocks;
}

// Fetch forex/indices from database (populated by Python script when it works)
async function fetchForexData() {
  const forex: any[] = [];
  const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'US500', 'UK100', 'GOLD', 'OIL_BRENT'];
  
  for (const symbol of symbols) {
    try {
      const result = await pool.query(
        `SELECT * FROM market_data 
         WHERE symbol = $1 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [symbol]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const changePct = parseFloat(row.change_pct || 0);
        const emoji = changePct >= 0 ? '🟢' : '🔴';
        
        forex.push({
          name: symbol.replace('_', ' '),
          bid: parseFloat(row.bid || row.price).toFixed(row.symbol.includes('JPY') ? 3 : 5),
          ask: parseFloat(row.ask || row.price).toFixed(row.symbol.includes('JPY') ? 3 : 5),
          change: `${emoji} ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
        });
      }
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
    }
  }
  
  return forex;
}

export async function GET() {
  try {
    const stocks = await fetchStockData();
    const forex = await fetchForexData();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stocks,
      forex,
      source: 'Yahoo Finance API (real-time)'
    });
  } catch (error: any) {
    console.error('Market scan error:', error);
    return NextResponse.json({ 
      error: error.message,
      stocks: [],
      forex: []
    }, { status: 500 });
  }
}
