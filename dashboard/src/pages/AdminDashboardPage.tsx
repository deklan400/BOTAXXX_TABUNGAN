import React, { useEffect, useState } from 'react';
import { adminAPI, AdminStats } from '../api/adminAPI';
import { StatCard } from '../components/cards/StatCard';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage your application and users</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon="👥"
          />
          <StatCard
            title="Active Users"
            value={stats.active_users}
            icon="✅"
          />
          <StatCard
            title="Suspended Users"
            value={stats.suspended_users}
            icon="⛔"
          />
          <StatCard
            title="Admin Users"
            value={stats.admin_users}
            icon="🛡️"
          />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-2">Quick Actions</h3>
          <p className="text-gray-400 text-sm mb-4">Common admin tasks</p>
          <div className="space-y-2">
            <a href="/admin/users" className="block text-primary-400 hover:text-primary-300 text-sm">
              → Manage Users
            </a>
            <a href="/admin/maintenance" className="block text-primary-400 hover:text-primary-300 text-sm">
              → Maintenance Mode
            </a>
            <a href="/admin/broadcast" className="block text-primary-400 hover:text-primary-300 text-sm">
              → Broadcast Alert
            </a>
            <a href="/admin/banks" className="block text-primary-400 hover:text-primary-300 text-sm">
              → Bank Management
            </a>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-2">System Status</h3>
          <p className="text-gray-400 text-sm mb-4">Current system state</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">API Status</span>
              <span className="text-green-400 text-sm">● Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Database</span>
              <span className="text-green-400 text-sm">● Connected</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-2">Recent Activity</h3>
          <p className="text-gray-400 text-sm">No recent activity</p>
        </div>
      </div>
    </div>
  );
};

