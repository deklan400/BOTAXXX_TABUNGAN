import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { StatCard } from '../components/cards/StatCard';
import { LineChart } from '../components/charts/LineChart';
import axiosClient from '../api/axiosClient';

export const OverviewPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setError(null);
        const response = await axiosClient.get('/overview');
        setOverview(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch overview');
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-gray-400">Loading financial data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded-xl">
          <p className="font-semibold">Error loading data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!overview) {
    return (
      <DashboardLayout>
        <div className="text-center text-gray-400 py-12">
          <p className="text-xl mb-2">No data available</p>
          <p className="text-sm">Start adding transactions to see your financial overview</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Financial Overview
            </h1>
            <p className="text-gray-400">Track your financial health at a glance</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Balance"
            value={overview.total_balance}
            icon="💰"
          />
          <StatCard
            title="Active Loans"
            value={overview.total_active_loans_amount}
            icon="📑"
          />
          <StatCard
            title="Targets Progress"
            value={overview.total_target_current_amount}
            icon="🎯"
          />
          <StatCard
            title="Monthly Income"
            value={overview.total_income_month}
            icon="📈"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {overview.daily_trend && overview.daily_trend.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-slate-700/50">Daily Trend</h2>
              <LineChart
                data={overview.daily_trend}
                xKey="date"
                lines={[
                  { key: 'income', name: 'Income', color: '#10b981' },
                  { key: 'expense', name: 'Expense', color: '#ef4444' },
                ]}
              />
            </div>
          )}

          {overview.monthly_summaries && overview.monthly_summaries.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-slate-700/50">Monthly Summary</h2>
              <LineChart
                data={overview.monthly_summaries.map((m: any) => ({
                  ...m,
                  month: `${m.year}-${m.month}`,
                }))}
                xKey="month"
                lines={[
                  { key: 'income', name: 'Income', color: '#10b981' },
                  { key: 'expense', name: 'Expense', color: '#ef4444' },
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

