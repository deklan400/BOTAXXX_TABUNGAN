import React, { useEffect, useState } from 'react';
import { maintenanceAPI, MaintenanceStatus } from '../api/maintenanceAPI';

export const MaintenancePage: React.FC = () => {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    // Check status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await maintenanceAPI.getStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const message = status?.message || 'System is under maintenance. Please try again later.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 md:p-12 border border-slate-700/50 shadow-2xl text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
              <svg
                className="w-12 h-12 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Maintenance Mode
          </h1>

          {/* Message */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            {message}
          </p>

          {/* Info */}
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
            <p className="text-sm text-gray-400">
              Kami sedang melakukan pemeliharaan sistem untuk memberikan pengalaman yang lebih baik.
              Silakan coba lagi nanti.
            </p>
          </div>

          {/* Animated dots */}
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

