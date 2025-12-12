import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, AdminStats } from '../api/adminAPI';
import { AdminStatCard } from '../components/cards/AdminStatCard';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
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
          <AdminStatCard
            title="Total Users"
            value={stats.total_users}
            icon="👥"
            color="blue"
          />
          <AdminStatCard
            title="Active Users"
            value={stats.active_users}
            icon="✅"
            color="green"
          />
          <AdminStatCard
            title="Suspended Users"
            value={stats.suspended_users}
            icon="⛔"
            color="red"
          />
          <AdminStatCard
            title="Admin Users"
            value={stats.admin_users}
            icon="🛡️"
            color="purple"
          />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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

