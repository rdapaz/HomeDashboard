import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bus } from 'lucide-react';

const ROUTE_COLORS = {
  '114': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  '115': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  '160': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

export default function BusWidget() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const resp = await axios.get('/api/bus');
      setData(resp.data);
      setError(null);
    } catch (e) {
      setError('Failed to load bus data');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2 * 60 * 1000); // 2 min
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-3">
      <div className="flex items-center gap-2 mb-2">
        <Bus className="text-indigo-500 dark:text-indigo-400 h-4 w-4" />
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Transperth Buses</h2>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="space-y-1.5">
        {data?.stops?.map((stop, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
              {stop.stop}
            </div>

            {stop.departures?.length > 0 ? (
              <div className="space-y-0.5">
                {stop.departures.map((dep, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0 rounded ${ROUTE_COLORS[dep.route] || 'bg-gray-200 text-gray-700'}`}>
                        {dep.route}
                      </span>
                      <span className="text-xs text-gray-700 dark:text-gray-200">
                        {dep.departure}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${
                      dep.minutes <= 5 ? 'text-red-500' :
                      dep.minutes <= 15 ? 'text-yellow-500' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {dep.minutes === 0 ? 'Now' :
                       dep.minutes === 1 ? '1 min' :
                       `${dep.minutes} min`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">No upcoming departures</p>
            )}
          </div>
        ))}

        {!data && !error && (
          <p className="text-gray-400 text-sm">Loading...</p>
        )}
      </div>
    </div>
  );
}
