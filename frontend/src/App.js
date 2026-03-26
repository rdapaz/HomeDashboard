import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Camera, LayoutGrid, Play, Pause } from 'lucide-react';
import WeatherWidget from './components/WeatherWidget';
import TrafficWidget from './components/TrafficWidget';
import BusWidget from './components/BusWidget';
import WorldClocks from './components/WorldClocks';
import GarageWidget from './components/GarageWidget';
import FinanceWidget from './components/FinanceWidget';
import DarkModeToggle from './components/DarkModeToggle';
import CameraGrid from './components/CameraGrid';

const PAGE_CAMERAS = 0;
const PAGE_DASHBOARD = 1;

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activePage, setActivePage] = useState(PAGE_CAMERAS);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [carouselConfig, setCarouselConfig] = useState({
    camera_duration: 40,
    dashboard_duration: 10,
  });

  const startTimeRef = useRef(Date.now());
  const animFrameRef = useRef(null);

  // Theme setup
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-theme');
    const dark = saved ? saved === 'dark' : true;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const toggleDark = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('dashboard-theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  // Fetch carousel config from backend
  useEffect(() => {
    axios.get('/api/cameras').then((resp) => {
      if (resp.data.carousel) {
        setCarouselConfig(resp.data.carousel);
      }
    }).catch(() => {});
  }, []);

  const currentDuration = activePage === PAGE_CAMERAS
    ? carouselConfig.camera_duration
    : carouselConfig.dashboard_duration;

  // Reset progress timer when page changes
  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);
  }, [activePage]);

  // Auto-cycle and progress animation
  const tick = useCallback(() => {
    if (isPaused) return;

    const elapsed = Date.now() - startTimeRef.current;
    const durationMs = currentDuration * 1000;
    const pct = Math.min((elapsed / durationMs) * 100, 100);
    setProgress(pct);

    if (elapsed >= durationMs) {
      setActivePage((prev) => (prev + 1) % 2);
    } else {
      animFrameRef.current = requestAnimationFrame(tick);
    }
  }, [isPaused, currentDuration]);

  useEffect(() => {
    if (isPaused) {
      setProgress(0);
      return;
    }
    startTimeRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [tick, isPaused]);

  const goToPage = (page) => {
    setActivePage(page);
    startTimeRef.current = Date.now();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Header - only visible on dashboard page */}
      <header
        className={`px-4 py-2 flex items-center justify-between shrink-0 transition-all duration-700 ${
          activePage === PAGE_DASHBOARD ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0 overflow-hidden py-0'
        }`}
      >
        <h1 className="text-lg font-bold text-gray-800 dark:text-white">
          Home Dashboard
        </h1>
        <DarkModeToggle isDark={isDark} onToggle={toggleDark} />
      </header>

      {/* Pages */}
      <main className="relative flex-1 overflow-hidden">
        {/* Camera Page */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            activePage === PAGE_CAMERAS
              ? 'opacity-100 z-10'
              : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <CameraGrid globalPaused={isPaused} />
        </div>

        {/* Dashboard Page */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 overflow-auto ${
            activePage === PAGE_DASHBOARD
              ? 'opacity-100 z-10'
              : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <div className="px-4 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <WeatherWidget />
              <TrafficWidget />
              <BusWidget />
              <WorldClocks />
              <GarageWidget />
              <FinanceWidget />
            </div>
          </div>
        </div>
      </main>

      {/* Navigation Overlay */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
        <button
          onClick={() => goToPage(PAGE_CAMERAS)}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Cameras"
        >
          <Camera
            className={`h-4 w-4 transition-colors ${
              activePage === PAGE_CAMERAS ? 'text-white' : 'text-gray-400'
            }`}
          />
        </button>

        {/* Progress bar */}
        <div className="w-20 h-1 bg-gray-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full"
            style={{
              width: isPaused ? '0%' : `${progress}%`,
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        <button
          onClick={() => goToPage(PAGE_DASHBOARD)}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
          title="Dashboard"
        >
          <LayoutGrid
            className={`h-4 w-4 transition-colors ${
              activePage === PAGE_DASHBOARD ? 'text-white' : 'text-gray-400'
            }`}
          />
        </button>

        <div className="w-px h-4 bg-gray-500" />

        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-1 rounded-full hover:bg-white/10 transition-colors"
          title={isPaused ? 'Resume auto-cycle' : 'Pause auto-cycle'}
        >
          {isPaused ? (
            <Play className="h-4 w-4 text-white" />
          ) : (
            <Pause className="h-4 w-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
