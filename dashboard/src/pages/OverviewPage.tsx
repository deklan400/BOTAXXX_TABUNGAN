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
      <div className="space-y-8 animate-fade-in">
        {/* Header with modern design */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent drop-shadow-2xl">
              Financial Overview
            </h1>
            <p className="text-gray-400 text-lg">Track your financial health at a glance</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Live</span>
          </div>
        </div>

        {/* Stats Grid with stagger animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
            <StatCard
              title="Total Balance"
              value={overview.total_balance}
              icon="💰"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Active Loans"
              value={overview.total_active_loans_amount}
              icon="📑"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="Targets Progress"
              value={overview.total_target_current_amount}
              icon="🎯"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <StatCard
              title="Monthly Income"
              value={overview.total_income_month}
              icon="📈"
            />
          </div>
        </div>

        {/* Charts Grid with modern cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {overview.daily_trend && overview.daily_trend.length > 0 && (
            <div className="group bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 hover:shadow-primary-500/20 hover:shadow-2xl hover:border-primary-500/50 transition-all duration-500 overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Daily Trend
                </h2>
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
              </div>
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
            <div className="group bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 hover:shadow-primary-500/20 hover:shadow-2xl hover:border-primary-500/50 transition-all duration-500 overflow-hidden">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Monthly Summary
                </h2>
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
              </div>
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

