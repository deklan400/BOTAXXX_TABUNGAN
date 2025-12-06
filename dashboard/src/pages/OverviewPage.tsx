import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { StatCard } from '../components/cards/StatCard';
import { LineChart } from '../components/charts/LineChart';
import axiosClient from '../api/axiosClient';
import { formatRupiah } from '../utils/formatRupiah';

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
        <div className="text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!overview) {
    return (
      <DashboardLayout>
        <div className="text-center">No data available</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Financial Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {overview.daily_trend && overview.daily_trend.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Daily Trend</h2>
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Monthly Summary</h2>
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
    </DashboardLayout>
  );
};

