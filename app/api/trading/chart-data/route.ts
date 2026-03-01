import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'CRM';
    const period = searchParams.get('period') || '1d'; // 1d, 1w, 1m, 3m
    
    // Map period to Yahoo Finance range
    const rangeMap: { [key: string]: string } = {
      '1d': '1d',
      '1w': '5d',
      '1m': '1mo',
      '3m': '3mo'
    };
    
    const range = rangeMap[period] || '1d';
    const interval = period === '1d' ? '5m' : period === '1w' ? '30m' : '1d';
    
    // Fetch from Yahoo Finance
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Failed to fetch chart data',
        symbol,
        period 
      }, { status: 500 });
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      return NextResponse.json({ 
        error: 'No data available',
        symbol,
        period 
      }, { status: 404 });
    }
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];
    
    if (!quotes) {
      return NextResponse.json({ 
        error: 'No quote data',
        symbol,
        period 
      }, { status: 404 });
    }
    
    const closes = quotes.close || [];
    const volumes = quotes.volume || [];
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    
    // Format data for charts
    const chartData = timestamps.map((timestamp: number, index: number) => {
      const date = new Date(timestamp * 1000);
      let timeLabel = '';
      
      if (period === '1d') {
        timeLabel = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      } else if (period === '1w') {
        timeLabel = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit' });
      } else {
        timeLabel = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      }
      
      return {
        time: timeLabel,
        timestamp,
        price: closes[index] ? parseFloat(closes[index].toFixed(2)) : null,
        volume: volumes[index] || 0,
        high: highs[index] ? parseFloat(highs[index].toFixed(2)) : null,
        low: lows[index] ? parseFloat(lows[index].toFixed(2)) : null
      };
    }).filter(d => d.price !== null);
    
    // Get current price and stats
    const currentPrice = closes[closes.length - 1] || 0;
    const previousPrice = closes[0] || 0;
    const change = currentPrice - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
    
    return NextResponse.json({
      symbol,
      period,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      dataPoints: chartData.length,
      chartData
    });
  } catch (error: any) {
    console.error('Chart data error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
