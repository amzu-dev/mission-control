"use client";

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trading/market-scan')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}
      
      {data && (
        <div>
          <h2 className="text-xl font-bold mt-4 mb-2">Response:</h2>
          <pre className="bg-gray-800 p-4 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
          
          <h2 className="text-xl font-bold mt-4 mb-2">Stocks ({data.stocks?.length || 0}):</h2>
          <div className="grid grid-cols-3 gap-4">
            {data.stocks?.map((stock: any) => (
              <div key={stock.symbol} className="bg-gray-800 p-3 rounded">
                <div className="font-bold">{stock.symbol}</div>
                <div className="text-sm text-gray-400">{stock.price}</div>
                <div className="text-sm text-green-400">{stock.change}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
