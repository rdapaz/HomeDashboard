import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ParkingSquare } from 'lucide-react';

export default function ParkingWidget() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const resp = await axios.get('/api/parking');
      setData(resp.data);
      setError(null);
    } catch (e) {
      setError('Failed to load parking');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <ParkingSquare className="text-indigo-500 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Perth CBD Parking</h2>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {data?.note && (
        <p className="text-yellow-500 text-sm mb-2">{data.note}</p>
      )}

      <div className="space-y-2">
        {data?.locations?.map((loc, i) => (
          <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-700 dark:text-gray-200 truncate mr-2">{loc.name}</span>
            <span className={`text-sm font-bold ${
              loc.available > 50 ? 'text-green-500' :
              loc.available > 10 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {loc.available > 0 ? `${loc.available} bays` : 'FULL'}
            </span>
          </div>
        ))}

        {(!data || !data.locations?.length) && !data?.note && !error && (
          <p className="text-gray-400 text-sm">Loading...</p>
        )}
      </div>
    </div>
  );
}
