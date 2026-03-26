import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Camera, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react';

// CHANGEME: fallback cycle duration (seconds) if backend config is unavailable
const DEFAULT_CYCLE_DURATION = 10;
// CHANGEME: seconds of inactivity after manual navigation before auto-cycle resumes
const RESUME_DELAY = 30;

export default function CameraGrid({ globalPaused = false }) {
  const [cameras, setCameras] = useState([]);
  const [go2rtcOnline, setGo2rtcOnline] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cycleDuration, setCycleDuration] = useState(DEFAULT_CYCLE_DURATION);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const resumeTimerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const animFrameRef = useRef(null);

  // Fetch camera list
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const resp = await axios.get('/api/cameras');
        setCameras(resp.data.cameras || []);
        setGo2rtcOnline(resp.data.go2rtc_online);
        if (resp.data.camera_cycle_duration) {
          setCycleDuration(resp.data.camera_cycle_duration);
        }
        setError(null);
      } catch {
        setError('Camera service unavailable');
      }
    };
    fetchCameras();
    const interval = setInterval(fetchCameras, 60000);
    return () => clearInterval(interval);
  }, []);

  // Advance to next camera
  const goNext = useCallback(() => {
    setCameras((cams) => {
      if (cams.length === 0) return cams;
      setActiveIndex((prev) => (prev + 1) % cams.length);
      return cams;
    });
    startTimeRef.current = Date.now();
    setProgress(0);
  }, []);

  // Go to previous camera
  const goPrev = useCallback(() => {
    setCameras((cams) => {
      if (cams.length === 0) return cams;
      setActiveIndex((prev) => (prev - 1 + cams.length) % cams.length);
      return cams;
    });
    startTimeRef.current = Date.now();
    setProgress(0);
  }, []);

  // Manual navigation — pause auto-cycle, resume after RESUME_DELAY
  const manualNav = useCallback((direction) => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    if (direction === 'next') goNext();
    else goPrev();
    resumeTimerRef.current = setTimeout(() => {
      setPaused(false);
      startTimeRef.current = Date.now();
    }, RESUME_DELAY * 1000);
  }, [goNext, goPrev]);

  // Auto-cycle timer
  useEffect(() => {
    if (paused || globalPaused || cameras.length <= 1) return;

    startTimeRef.current = Date.now();
    setProgress(0);

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const durationMs = cycleDuration * 1000;
      const pct = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(pct);

      if (elapsed >= durationMs) {
        goNext();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [paused, globalPaused, cameras.length, cycleDuration, activeIndex, goNext]);

  // Cleanup resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-gray-400">
          <WifiOff className="h-12 w-12 mx-auto mb-3" />
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center text-gray-400">
          <Camera className="h-12 w-12 mx-auto mb-3" />
          <p className="text-lg">No cameras configured</p>
        </div>
      </div>
    );
  }

  const cam = cameras[activeIndex] || cameras[0];

  return (
    <div className="relative h-full w-full bg-black">
      {/* Camera feed — full screen */}
      {cam.active && go2rtcOnline ? (
        <iframe
          key={cam.id}
          src={cam.stream_url}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay"
          title={cam.name}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <WifiOff className="h-16 w-16 mx-auto mb-3" />
            <p className="text-lg">Offline</p>
          </div>
        </div>
      )}

      {/* Camera name overlay */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent px-4 py-3 pointer-events-none z-20">
        <span className="text-white text-lg font-semibold drop-shadow-lg">
          {cam.name}
        </span>
        <span className="text-gray-300 text-sm ml-3">
          {activeIndex + 1} / {cameras.length}
        </span>
      </div>

      {/* Left / Right navigation arrows */}
      {cameras.length > 1 && (
        <>
          <button
            onClick={() => manualNav('prev')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
            title="Previous camera"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={() => manualNav('next')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-colors"
            title="Next camera"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {cameras.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
          {cameras.map((c, i) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveIndex(i);
                startTimeRef.current = Date.now();
                setProgress(0);
                setPaused(true);
                if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = setTimeout(() => {
                  setPaused(false);
                  startTimeRef.current = Date.now();
                }, RESUME_DELAY * 1000);
              }}
              className={`rounded-full transition-all ${
                i === activeIndex
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-gray-400 hover:bg-gray-300'
              }`}
              title={c.name}
            />
          ))}
        </div>
      )}

      {/* Progress bar — thin line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800 z-20">
        <div
          className="h-full bg-indigo-400 transition-none"
          style={{ width: (paused || globalPaused) ? '0%' : `${progress}%` }}
        />
      </div>
    </div>
  );
}
