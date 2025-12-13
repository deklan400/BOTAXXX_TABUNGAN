import React, { useState, useEffect, useRef } from 'react';
import { userAPI } from '../api/userAPI';

interface Alert {
  id: number;
  title: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AlertResponse {
  alerts: Alert[];
  total: number;
  unread_count: number;
}

export const AlertBell: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response: AlertResponse = await userAPI.getAlerts(0, 10, true);
      setAlerts(response.alerts);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: number) => {
    try {
      await userAPI.markAlertAsRead(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await userAPI.markAllAlertsAsRead();
      setAlerts(alerts.map(alert => ({ ...alert, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all alerts as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadAlerts();
          }
        }}
        className="relative p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 transition-colors border border-slate-600/50"
      >
        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 z-50 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Notifikasi</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Tandai semua sudah dibaca
              </button>
            )}
          </div>

          {/* Alerts List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>Tidak ada notifikasi</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => !alert.is_read && markAsRead(alert.id)}
                    className={`p-4 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                      !alert.is_read ? 'bg-purple-500/10 border-l-4 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        !alert.is_read ? 'bg-purple-400' : 'bg-transparent'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        {alert.title && (
                          <h4 className="text-white font-semibold mb-1">{alert.title}</h4>
                        )}
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{formatDate(alert.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

