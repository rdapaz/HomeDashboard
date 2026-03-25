import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DoorOpen, DoorClosed, Loader, Warehouse, Clock } from 'lucide-react';

export default function GarageWidget() {
  const [status, setStatus] = useState('Unknown');
  const [openMinutes, setOpenMinutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const resp = await axios.get('/api/garage/status');
      setStatus(resp.data.status || 'Unknown');
      setOpenMinutes(resp.data.open_minutes || null);
      setLastUpdated(new Date());
    } catch (e) {
      setStatus('Unavailable');
    }
  }, []);

  // Try WebSocket first, fall back to polling
  useEffect(() => {
    fetchStatus();

    // Attempt WebSocket to the Pi directly
    let ws;
    let reconnectTimer;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://192.168.1.143/ws');

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setStatus(data.status);
          setLastUpdated(new Date());
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (e) {
        // WebSocket not available, fall back to polling
      }
    };

    connectWs();

    // Polling fallback every 30s
    const pollInterval = setInterval(fetchStatus, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [fetchStatus]);

  const toggleGarage = async () => {
    setLoading(true);
    try {
      const resp = await axios.post('/api/garage/toggle');
      setStatus(resp.data.status || status);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Toggle error:', e);
    }
    setLoading(false);
  };

  const StatusIcon = status === 'Open' ? DoorOpen :
                     status === 'Closed' ? DoorClosed :
                     Loader;

  const statusColor = status === 'Open' ? 'text-green-500' :
                      status === 'Closed' ? 'text-red-500' :
                      'text-gray-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
      <div className="flex items-center gap-2 mb-4">
        <Warehouse className="text-indigo-500 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Garage</h2>
      </div>

      <div className="text-center">
        <StatusIcon
          className={`h-16 w-16 mx-auto ${statusColor} ${status === 'Unknown' ? 'animate-spin' : ''}`}
        />
        <p className="mt-3 text-lg font-semibold text-gray-800 dark:text-white">
          {status}
        </p>
        {status === 'Open' && openMinutes != null && (
          <div className="flex items-center justify-center gap-1 mt-1 text-sm text-yellow-600 dark:text-yellow-400">
            <Clock className="h-4 w-4" />
            <span>
              Open for {openMinutes >= 60
                ? `${Math.floor(openMinutes / 60)}h ${openMinutes % 60}m`
                : `${openMinutes} min`}
            </span>
          </div>
        )}

        <button
          onClick={toggleGarage}
          disabled={loading || status === 'Unavailable'}
          className={`mt-4 w-full py-2 px-4 rounded-lg text-sm font-medium text-white transition-colors ${
            loading || status === 'Unavailable'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader className="h-4 w-4 animate-spin" /> Working...
            </span>
          ) : (
            'Toggle Garage Door'
          )}
        </button>

        {lastUpdated && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Updated: {lastUpdated.toLocaleTimeString('en-AU')}
          </p>
        )}
      </div>
    </div>
  );
}
