import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CITIES = [
  { name: 'Perth', timezone: 'Australia/Perth', flag: '\ud83c\udde6\ud83c\uddfa' },
  { name: 'Lisbon', timezone: 'Europe/Lisbon', flag: '\ud83c\uddf5\ud83c\uddf9' },
  { name: 'S\u00e3o Paulo', timezone: 'America/Sao_Paulo', flag: '\ud83c\udde7\ud83c\uddf7' },
  { name: 'Houston', timezone: 'America/Chicago', flag: '\ud83c\uddfa\ud83c\uddf8' },
];

export default function WorldClocks() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (tz) => {
    return now.toLocaleTimeString('en-AU', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (tz) => {
    return now.toLocaleDateString('en-AU', {
      timeZone: tz,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="text-indigo-500 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">World Clocks</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CITIES.map((city) => (
          <div key={city.name} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-lg mb-1">{city.flag}</div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {city.name}
            </div>
            <div className="text-xl font-mono font-bold text-gray-900 dark:text-white mt-1">
              {formatTime(city.timezone)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(city.timezone)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
