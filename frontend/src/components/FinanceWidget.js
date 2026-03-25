import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Bitcoin, DollarSign } from 'lucide-react';

export default function FinanceWidget() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const resp = await axios.get('/api/finance');
      setData(resp.data);
      setError(null);
    } catch (e) {
      setError('Failed to load finance data');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatAUD = (val) => {
    if (val == null) return '-';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(val);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-3">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="text-indigo-500 dark:text-indigo-400 h-4 w-4" />
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Finance</h2>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* BTC + FX row */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Bitcoin */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
            <Bitcoin className="h-3 w-3" /> BTC/AUD
          </div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {data?.bitcoin?.price_aud ? formatAUD(data.bitcoin.price_aud) : '-'}
          </div>
          {data?.bitcoin?.change_24h_pct != null && (
            <div className={`text-xs flex items-center gap-1 ${
              data.bitcoin.change_24h_pct >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {data.bitcoin.change_24h_pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {data.bitcoin.change_24h_pct.toFixed(2)}%
            </div>
          )}
        </div>

        {/* USD/AUD */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
          <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">USD/AUD</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {data?.exchange_rate?.usd_to_aud ? `$${data.exchange_rate.usd_to_aud.toFixed(4)}` : '-'}
          </div>
          {data?.exchange_rate?.date && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {data.exchange_rate.date}
            </div>
          )}
        </div>
      </div>

      {/* ASX Top Movers */}
      {data?.asx && !data.asx.error && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">ASX Top Movers</h3>

          {/* Gainers */}
          {data.asx.top_gainers?.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-green-500 font-medium mb-1">Top Gainers</div>
              <div className="space-y-1">
                {data.asx.top_gainers.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between text-xs bg-green-50 dark:bg-green-900/20 rounded px-2 py-1">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{stock.symbol}</span>
                    <span className="text-gray-500 dark:text-gray-400">${stock.price}</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> +{stock.change_pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Losers */}
          {data.asx.top_losers?.length > 0 && (
            <div>
              <div className="text-xs text-red-500 font-medium mb-1">Top Losers</div>
              <div className="space-y-1">
                {data.asx.top_losers.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-900/20 rounded px-2 py-1">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{stock.symbol}</span>
                    <span className="text-gray-500 dark:text-gray-400">${stock.price}</span>
                    <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" /> {stock.change_pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data?.asx?.error && (
        <p className="text-yellow-500 text-xs">{data.asx.error}</p>
      )}
    </div>
  );
}
