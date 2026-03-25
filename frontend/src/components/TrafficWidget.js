import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Car } from 'lucide-react';

const CONGESTION_COLORS = {
  free: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  heavy: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const CONGESTION_DOT = {
  free: 'bg-green-500',
  moderate: 'bg-yellow-500',
  heavy: 'bg-red-500',
  unknown: 'bg-gray-500',
};

export default function TrafficWidget() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const resp = await axios.get('/api/traffic');
      setData(resp.data);
      setError(null);
    } catch (e) {
      setError('Failed to load traffic');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-3">
      <div className="flex items-center gap-2 mb-2">
        <Car className="text-indigo-500 dark:text-indigo-400 h-4 w-4" />
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Traffic</h2>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {data?.error && (
        <p className="text-yellow-500 text-xs mb-1">{data.error}</p>
      )}

      <div className="space-y-1.5">
        {data?.roads?.map((road, i) => (
          <div key={i} className={`rounded-lg px-2.5 py-1.5 ${CONGESTION_COLORS[road.congestion]}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{road.label}</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${CONGESTION_DOT[road.congestion]}`}></span>
                <span className="text-[10px] font-semibold uppercase">{road.congestion}</span>
              </div>
            </div>
            <div className="text-[10px] mt-0.5 opacity-75">
              {road.current_speed_kmh} km/h (free flow: {road.free_flow_speed_kmh} km/h)
            </div>
          </div>
        ))}

        {(!data || (!data.roads?.length && !data.error)) && (
          <p className="text-gray-400 text-sm">Loading...</p>
        )}
      </div>
    </div>
  );
}
