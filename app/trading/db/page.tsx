"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';

interface Rule {
  id: number;
  rule_name: string;
  rule_type: string;
  rule_value: string;
  enabled: boolean;
  priority: number;
}

interface Lesson {
  id: number;
  lesson_date: string;
  title: string;
  description: string;
  mistake_type: string;
  action_taken: string;
}

interface Signal {
  id: number;
  symbol: string;
  signal_type: string;
  direction: string;
  price: number;
  rsi: number;
  created_at: string;
  actioned: boolean;
}

interface Trade {
  id: number;
  symbol: string;
  direction: string;
  entry_price: number;
  exit_price: number;
  pl_amount: number;
  entry_time: string;
  exit_time: string;
  status: string;
  strategy: string;
}

interface QuotaStatus {
  alphaVantage: {
    used: number;
    limit: number;
    remaining: number;
    percentUsed: number;
  };
  finnhub: {
    used: number;
    limit: string;
    rateLimit: string;
  };
}

export default function TradingDatabase() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [canSync, setCanSync] = useState(true);
  const [nextSyncMinutes, setNextSyncMinutes] = useState<number>(15);

  useEffect(() => {
    fetchData();
    fetchQuota();
    
    // Auto-refresh every 30 seconds
    const dataInterval = setInterval(fetchData, 30000);
    const quotaInterval = setInterval(fetchQuota, 60000); // Check quota every minute
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(quotaInterval);
    };
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/trading/db/performance');
      const data = await res.json();
      
      if (data.rules) setRules(data.rules);
      if (data.lessons) setLessons(data.lessons);
      if (data.recentTrades) setTrades(data.recentTrades);
      if (data.performance) setPerformance(data.performance);
      
      // Fetch signals separately
      const signalsRes = await fetch('/api/trading/db/signals?limit=10');
      const signalsData = await signalsRes.json();
      if (signalsData.signals) setSignals(signalsData.signals);
    } catch (error) {
      console.error('Failed to fetch database data:', error);
    }
  }

  async function fetchQuota() {
    try {
      const res = await fetch('/api/trading/quota');
      const data = await res.json();
      
      if (data.quota) {
        setQuota(data.quota);
        setCanSync(data.canSync);
        setNextSyncMinutes(data.recommendedIntervalMinutes || 15);
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    }
  }

  async function syncData(type: string) {
    setSyncing(true);
    
    const loadingToast = toast.loading(`Syncing ${type}...`);
    
    try {
      const res = await fetch('/api/trading/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message, { 
          id: loadingToast,
          description: data.quota ? `Quota: ${data.quota.used}/${data.quota.used + data.quota.remaining} used` : undefined,
          duration: 3000,
        });
        fetchData();
        fetchQuota();
      } else {
        toast.error('Sync failed', {
          id: loadingToast,
          description: data.error || 'Unknown error',
          duration: 5000,
        });
      }
    } catch (error: any) {
      toast.error('Sync error', {
        id: loadingToast,
        description: error.message,
        duration: 5000,
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100 p-6">
      <Toaster 
        position="top-right" 
        theme="dark"
        richColors
        closeButton
      />
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">📊 Trading Database</h1>
            <p className="text-gray-400 mt-1">PostgreSQL: findash@localhost:5432</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/trading')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-semibold"
            >
              Mission Control
            </button>
          </div>
        </div>

        {/* Quota Status */}
        {quota && (
          <div className="bg-[#0d1117] rounded-lg p-4 border border-gray-800 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">API Quota Status</h3>
                <div className="flex gap-6">
                  <div>
                    <div className="text-xs text-gray-500">Alpha Vantage (Daily)</div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold">
                        {quota.alphaVantage.used} / {quota.alphaVantage.limit}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        quota.alphaVantage.percentUsed > 90 ? 'bg-red-900/30 text-red-400' :
                        quota.alphaVantage.percentUsed > 70 ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-green-900/30 text-green-400'
                      }`}>
                        {quota.alphaVantage.percentUsed}%
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-48 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          quota.alphaVantage.percentUsed > 90 ? 'bg-red-500' :
                          quota.alphaVantage.percentUsed > 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${quota.alphaVantage.percentUsed}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Finnhub (Rate Limit)</div>
                    <div className="text-lg font-bold">{quota.finnhub.rateLimit}</div>
                    <div className="text-xs text-gray-400 mt-1">Unlimited daily</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Recommended Sync Interval</div>
                <div className="text-2xl font-bold text-blue-400">{nextSyncMinutes} min</div>
                <div className="text-xs text-gray-400 mt-1">
                  {canSync ? '✅ Ready to sync' : '⏳ Rate limited'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sync Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => syncData('market-scan')}
            disabled={syncing || !canSync}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-semibold"
            title={!canSync ? 'Rate limit: Wait before next sync' : 'Sync market data from Python scripts'}
          >
            🔄 Sync Market Data
          </button>
          <button
            onClick={() => syncData('positions')}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm font-semibold"
          >
            🔄 Sync Positions
          </button>
          <button
            onClick={() => syncData('account')}
            disabled={syncing}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded text-sm font-semibold"
          >
            🔄 Sync Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Performance */}
        {performance && (
          <div className="bg-[#0d1117] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 text-blue-400">📈 Performance Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Trades</div>
                <div className="text-2xl font-bold">{performance.total_trades || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Win Rate</div>
                <div className={`text-2xl font-bold ${(performance.win_rate || 0) >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                  {performance.win_rate ? `${performance.win_rate.toFixed(1)}%` : '0%'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg Win</div>
                <div className="text-2xl font-bold text-green-400">
                  £{performance.avg_win ? performance.avg_win.toFixed(2) : '0.00'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg Loss</div>
                <div className="text-2xl font-bold text-red-400">
                  £{performance.avg_loss ? performance.avg_loss.toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-500">Total P&L</div>
                <div className={`text-3xl font-bold ${(performance.total_pl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  £{performance.total_pl ? performance.total_pl.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trading Signals */}
        <div className="bg-[#0d1117] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-purple-400">🎯 Recent Signals</h2>
          <div className="space-y-2">
            {signals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No signals yet. Run market scan to generate.</p>
            ) : (
              signals.map((signal) => (
                <div key={signal.id} className="bg-[#121827] rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{signal.symbol}</div>
                      <div className="text-sm text-gray-400">{signal.signal_type}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded ${signal.direction === 'LONG' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {signal.direction}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(signal.created_at).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Price: ${signal.price.toFixed(2)} | RSI: {signal.rsi?.toFixed(1) || 'N/A'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Strategy Rules */}
        <div className="bg-[#0d1117] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">⚡ Hard Rules</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {rules.map((rule) => (
              <div key={rule.id} className="bg-[#121827] rounded p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{rule.rule_name}</div>
                    <div className="text-xs text-gray-400 mt-1">{rule.rule_value}</div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${rule.enabled ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                    {rule.enabled ? 'Active' : 'Disabled'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lessons Learned */}
        <div className="bg-[#0d1117] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 text-red-400">🧠 Lessons Learned</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="bg-[#121827] rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-sm">{lesson.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(lesson.lesson_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-2">{lesson.description}</div>
                <div className="text-xs text-blue-400">→ {lesson.action_taken}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="mt-6 bg-[#0d1117] rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 text-green-400">📜 Recent Trades</h2>
        {trades.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No trades in database yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3">Symbol</th>
                  <th className="text-left py-2 px-3">Direction</th>
                  <th className="text-left py-2 px-3">Entry</th>
                  <th className="text-left py-2 px-3">Exit</th>
                  <th className="text-left py-2 px-3">P&L</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Entry Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-2 px-3 font-semibold">{trade.symbol}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs ${trade.direction === 'LONG' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-2 px-3">${trade.entry_price?.toFixed(2) || 'N/A'}</td>
                    <td className="py-2 px-3">${trade.exit_price?.toFixed(2) || '-'}</td>
                    <td className={`py-2 px-3 font-semibold ${(trade.pl_amount || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      £{trade.pl_amount?.toFixed(2) || '-'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs ${trade.status === 'closed' ? 'bg-gray-700 text-gray-300' : 'bg-blue-900/30 text-blue-400'}`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-400">
                      {new Date(trade.entry_time).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
