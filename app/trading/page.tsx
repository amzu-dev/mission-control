"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stock {
  symbol: string;
  price: string;
  change: string;
  rsi: string;
}

interface Forex {
  name: string;
  bid: string;
  ask: string;
  change: string;
}

interface Position {
  symbol: string;
  direction: string;
  entry: string;
  current: string;
  pl: string;
}

interface AccountData {
  balance: number;
  totalPL: number;
  drawdown: number;
  positionCount: number;
}

interface Earning {
  symbol: string;
  date: string;
  daysUntil: string;
  priority: string;
}

export default function TradingDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [forex, setForex] = useState<Forex[]>([]);
  const [account, setAccount] = useState<AccountData>({
    balance: 0,
    totalPL: 0,
    drawdown: 0,
    positionCount: 0
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>('CRM');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1d');
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartInfo, setChartInfo] = useState<any>({ currentPrice: 0, changePercent: 0 });

  useEffect(() => {
    // Update clock every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Fetch data
    fetchMarketData();
    fetchPositions();
    fetchEarnings();
    fetchChartData();
    
    // Refresh market data every 5 seconds
    const marketInterval = setInterval(fetchMarketData, 5000);
    
    // Refresh positions every 10 seconds
    const positionsInterval = setInterval(fetchPositions, 10000);
    
    return () => {
      clearInterval(timer);
      clearInterval(marketInterval);
      clearInterval(positionsInterval);
    };
  }, []);
  
  // Fetch chart data when stock or period changes
  useEffect(() => {
    fetchChartData();
  }, [selectedStock, selectedPeriod]);

  async function fetchMarketData() {
    try {
      const res = await fetch('/api/trading/market-scan');
      const data = await res.json();
      
      console.log('Market data received:', data);
      
      if (data.stocks && data.stocks.length > 0) {
        console.log(`Setting ${data.stocks.length} stocks`);
        setStocks(data.stocks);
      } else {
        console.warn('No stocks in response:', data);
      }
      
      if (data.forex && data.forex.length > 0) {
        console.log(`Setting ${data.forex.length} forex pairs`);
        setForex(data.forex);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setLoading(false);
    }
  }

  async function fetchPositions() {
    try {
      const res = await fetch('/api/trading/positions');
      const data = await res.json();
      
      console.log('Positions data received:', data);
      
      if (data.account) {
        setAccount({
          balance: data.account.balance || 0,
          totalPL: data.account.totalPL || 0,
          drawdown: data.account.drawdown || 0,
          positionCount: data.account.positionCount || 0
        });
      }
      
      if (data.positions && data.positions.length > 0) {
        setPositions(data.positions);
      } else {
        setPositions([]);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  }

  async function fetchEarnings() {
    try {
      const res = await fetch('/api/trading/earnings');
      const data = await res.json();
      if (data.earnings) setEarnings(data.earnings);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    }
  }
  
  async function fetchChartData() {
    if (!selectedStock) return;
    
    setChartLoading(true);
    try {
      const res = await fetch(`/api/trading/chart-data?symbol=${selectedStock}&period=${selectedPeriod}`);
      const data = await res.json();
      
      if (data.chartData && data.chartData.length > 0) {
        setChartData(data.chartData);
        setChartInfo({
          currentPrice: data.currentPrice,
          changePercent: data.changePercent,
          change: data.change
        });
      } else {
        console.warn('No chart data available for', selectedStock);
        // Set fallback data
        setChartData([
          { time: '09:00', price: 185, volume: 1000000 },
          { time: '10:00', price: 187, volume: 1100000 },
          { time: '11:00', price: 189, volume: 1200000 },
          { time: '12:00', price: 191, volume: 1300000 }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setChartLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return `£${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      {/* Top Bar */}
      <div className="bg-[#121827] border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-blue-400">🐺 TRADING WOLF</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                {currentTime.toLocaleString('en-GB', { 
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZone: 'Europe/London'
                })} GMT
              </div>
              <a
                href="/trading/db"
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-semibold"
              >
                📊 Database
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs text-gray-500">BALANCE</div>
              <div className="text-lg font-bold">{formatCurrency(account.balance)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">P&L</div>
              <div className={`text-lg font-bold ${account.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(account.totalPL)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">DRAWDOWN</div>
              <div className={`text-lg font-bold ${account.drawdown >= -5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {formatPercent(account.drawdown)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">POSITIONS</div>
              <div className="text-lg font-bold text-blue-400">{account.positionCount}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Left Panel - Watchlist */}
        <div className="w-80 bg-[#0d1117] border-r border-gray-800 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400">WATCHLIST</h2>
              <button
                onClick={fetchMarketData}
                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                title="Refresh market data"
              >
                🔄
              </button>
            </div>
            
            {/* Stocks */}
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-2">STOCKS</div>
              {loading ? (
                <div className="text-center text-gray-600 py-4">Loading...</div>
              ) : stocks.length === 0 ? (
                <div className="text-center text-gray-600 py-4 text-sm">
                  No market data yet.
                  <br />
                  <button 
                    onClick={fetchMarketData}
                    className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                  >
                    Refresh Now
                  </button>
                </div>
              ) : (
                stocks.map((stock) => {
                  const changeStr = stock.change.replace('+', '').replace('%', '');
                  const change = parseFloat(changeStr);
                  const rsiStr = stock.rsi === 'N/A' ? 'N/A' : stock.rsi;
                  const rsi = rsiStr === 'N/A' ? NaN : parseFloat(rsiStr);
                  const isOversold = !isNaN(rsi) && rsi < 30;
                  const isOverbought = !isNaN(rsi) && rsi > 70;
                  
                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock.symbol)}
                      className={`p-2 mb-1 rounded cursor-pointer hover:bg-gray-800 ${
                        selectedStock === stock.symbol ? 'bg-blue-900/30 border border-blue-700' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{stock.symbol}</div>
                          <div className="text-xs text-gray-500">{stock.price}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {stock.change}
                          </div>
                          <div className={`text-xs ${isOversold ? 'text-green-400' : isOverbought ? 'text-red-400' : 'text-gray-500'}`}>
                            RSI {stock.rsi}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Forex & Indices */}
            <div>
              <div className="text-xs text-gray-500 mb-2">FOREX & INDICES</div>
              {forex.map((pair, idx) => (
                <div key={idx} className="p-2 mb-1 rounded hover:bg-gray-800">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm">{pair.name}</div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">{pair.bid}</div>
                      <div className={`text-xs ${pair.change.includes('🟢') ? 'text-green-400' : 'text-red-400'}`}>
                        {pair.change}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Main Chart Area */}
        <div className="flex-1 bg-[#0a0e1a] p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">{selectedStock}</h2>
              {chartInfo.currentPrice > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold">${chartInfo.currentPrice.toFixed(2)}</div>
                  <div className={`text-sm ${chartInfo.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {chartInfo.changePercent >= 0 ? '+' : ''}{chartInfo.changePercent.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-4 text-sm text-gray-400">
              <button 
                onClick={() => setSelectedPeriod('1d')}
                className={`pb-1 ${selectedPeriod === '1d' ? 'text-blue-400 border-b-2 border-blue-400' : 'hover:text-blue-400'}`}
              >
                1D
              </button>
              <button 
                onClick={() => setSelectedPeriod('1w')}
                className={`pb-1 ${selectedPeriod === '1w' ? 'text-blue-400 border-b-2 border-blue-400' : 'hover:text-blue-400'}`}
              >
                1W
              </button>
              <button 
                onClick={() => setSelectedPeriod('1m')}
                className={`pb-1 ${selectedPeriod === '1m' ? 'text-blue-400 border-b-2 border-blue-400' : 'hover:text-blue-400'}`}
              >
                1M
              </button>
              <button 
                onClick={() => setSelectedPeriod('3m')}
                className={`pb-1 ${selectedPeriod === '3m' ? 'text-blue-400 border-b-2 border-blue-400' : 'hover:text-blue-400'}`}
              >
                3M
              </button>
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-[#0d1117] rounded-lg p-4 mb-4 relative">
            {chartLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117] bg-opacity-75 z-10">
                <div className="text-gray-400">Loading chart...</div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div className="bg-[#0d1117] rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">VOLUME</div>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="volume" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Panel - Positions & Earnings */}
        <div className="w-96 bg-[#0d1117] border-l border-gray-800 overflow-y-auto p-4">
          {/* Open Positions */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">OPEN POSITIONS</h2>
            {positions.length === 0 ? (
              <div className="text-center text-gray-600 py-4 text-sm">
                No open positions
              </div>
            ) : (
              positions.map((pos, idx) => {
                const plValue = parseFloat(pos.pl || '0');
                const entryValue = parseFloat(pos.entry || '0');
                const currentValue = parseFloat(pos.current || '0');
                
                return (
                  <div key={idx} className="bg-[#121827] rounded p-3 mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-semibold">{pos.symbol}</div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        pos.direction === 'LONG' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {pos.direction}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Entry:</span>
                        <span className="font-mono">{entryValue.toFixed(pos.symbol.includes('JPY') ? 3 : 5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current:</span>
                        <span className="font-mono">{currentValue.toFixed(pos.symbol.includes('JPY') ? 3 : 5)}</span>
                      </div>
                      <div className={`flex justify-between font-semibold ${plValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <span>P&L:</span>
                        <span>£{plValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Risk Metrics */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">RISK METRICS</h2>
            <div className="bg-[#121827] rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Max Drawdown</span>
                <span className="text-red-400">-10.00%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Drawdown</span>
                <span className={account.drawdown >= -5 ? 'text-yellow-400' : account.drawdown < -10 ? 'text-red-600 font-bold' : 'text-red-400'}>
                  {formatPercent(account.drawdown)}
                  {account.drawdown < -10 && ' ⚠️'}
                </span>
              </div>
              {account.drawdown < -10 && (
                <div className="bg-red-900/20 border border-red-800 rounded p-2 text-xs text-red-400">
                  ⚠️ LIMIT BREACHED: Stop trading until review
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Total P&L</span>
                <span className={account.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}>
                  £{account.totalPL.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Open Positions</span>
                <span className="text-blue-400">{account.positionCount}</span>
              </div>
            </div>
          </div>

          {/* Earnings Calendar */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 mb-3">EARNINGS CALENDAR</h2>
            {earnings.length === 0 ? (
              <div className="text-center text-gray-600 py-4 text-sm">
                No upcoming earnings
              </div>
            ) : (
              earnings.map((earning, idx) => (
                <div key={idx} className="bg-[#121827] rounded p-2 mb-2 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">{earning.symbol}</div>
                    <div className="text-xs text-gray-400">{earning.date}</div>
                  </div>
                  <div className="text-xs mt-1">{earning.priority}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
