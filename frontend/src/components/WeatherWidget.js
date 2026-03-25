import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CloudSun, Thermometer, Droplets, Wind } from 'lucide-react';

export default function WeatherWidget() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const resp = await axios.get('/api/weather');
      setData(resp.data);
      setError(null);
    } catch (e) {
      setError('Failed to load weather');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30 * 60 * 1000); // 30 min
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <WidgetCard title="Weather" icon={<CloudSun />}><p className="text-red-400">{error}</p></WidgetCard>;
  }

  if (!data || data.error) {
    return <WidgetCard title="Weather" icon={<CloudSun />}><p className="text-gray-400">Loading...</p></WidgetCard>;
  }

  return (
    <WidgetCard title="Weather - Bibra Lake" icon={<CloudSun />}>
      {/* Current conditions */}
      {data.current && data.current.temp !== null && (
        <div className="mb-4 flex items-center gap-4">
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            {Math.round(data.current.temp)}&deg;C
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <div className="flex items-center gap-1">
              <Droplets className="h-3 w-3" /> {data.current.humidity}%
            </div>
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3" /> {data.current.wind_speed_kmh} km/h {data.current.wind_direction}
            </div>
          </div>
        </div>
      )}

      {/* Today & Tomorrow */}
      <div className="grid grid-cols-2 gap-3">
        <DayForecast label="Today" day={data.today} />
        <DayForecast label="Tomorrow" day={data.tomorrow} />
      </div>
    </WidgetCard>
  );
}

function DayForecast({ label, day }) {
  if (!day) return null;
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{label}</div>
      <div className="flex items-center gap-1 mb-1">
        <Thermometer className="h-4 w-4 text-blue-400" />
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {day.temp_min !== null ? `${day.temp_min}` : '?'}&deg; - {day.temp_max !== null ? `${day.temp_max}` : '?'}&deg;
        </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300">{day.short_text}</p>
      {day.rain_chance > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <Droplets className="h-3 w-3 text-blue-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{day.rain_chance}% chance</span>
        </div>
      )}
    </div>
  );
}

function WidgetCard({ title, icon, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-indigo-500 dark:text-indigo-400">{icon}</span>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}
