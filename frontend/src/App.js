import React, { useState, useEffect } from 'react';
import WeatherWidget from './components/WeatherWidget';
import TrafficWidget from './components/TrafficWidget';
import BusWidget from './components/BusWidget';
import WorldClocks from './components/WorldClocks';
import GarageWidget from './components/GarageWidget';
import FinanceWidget from './components/FinanceWidget';
import DarkModeToggle from './components/DarkModeToggle';

export default function App() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-theme');
    const dark = saved ? saved === 'dark' : true; // default dark
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('dashboard-theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">
          Home Dashboard
        </h1>
        <DarkModeToggle isDark={isDark} onToggle={toggleDark} />
      </header>

      {/* Dashboard Grid */}
      <main className="px-4 pb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Row 1 */}
          <WeatherWidget />
          <TrafficWidget />
          <BusWidget />

          {/* Row 2 */}
          <WorldClocks />
          <GarageWidget />
          <FinanceWidget />
        </div>
      </main>
    </div>
  );
}
