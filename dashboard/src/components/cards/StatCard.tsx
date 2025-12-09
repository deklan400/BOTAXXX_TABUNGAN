import React from 'react';
import { formatRupiah } from '../../utils/formatRupiah';

interface StatCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="group relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg p-6 hover:shadow-xl hover:border-primary-500/50 transition-all duration-300 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {formatRupiah(value)}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-semibold ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 p-3 bg-primary-500/20 rounded-lg group-hover:bg-primary-500/30 transition-colors">
            <div className="text-3xl">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
};
