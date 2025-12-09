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
    <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 hover:shadow-primary-500/20 hover:shadow-2xl hover:border-primary-500/50 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/0 via-primary-500/20 to-primary-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
      
      <div className="relative flex items-center justify-between z-10">
        <div className="flex-1">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">{title}</p>
          <p className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent drop-shadow-lg">
            {formatRupiah(value)}
          </p>
          {trend && (
            <div className="flex items-center gap-2 mt-3">
              <span className={`text-sm font-bold px-2 py-1 rounded-md ${
                trend.isPositive 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 p-4 bg-gradient-to-br from-primary-500/30 to-primary-600/20 rounded-xl group-hover:from-primary-500/40 group-hover:to-primary-600/30 group-hover:scale-110 transition-all duration-300 shadow-lg">
            <div className="text-4xl filter drop-shadow-lg">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
};
