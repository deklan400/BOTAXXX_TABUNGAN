import React from 'react';

interface AdminStatCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({ 
  title, 
  value, 
  icon,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'from-blue-500/30 to-blue-600/20 group-hover:from-blue-500/40 group-hover:to-blue-600/30',
    green: 'from-green-500/30 to-green-600/20 group-hover:from-green-500/40 group-hover:to-green-600/30',
    red: 'from-red-500/30 to-red-600/20 group-hover:from-red-500/40 group-hover:to-red-600/30',
    purple: 'from-purple-500/30 to-purple-600/20 group-hover:from-purple-500/40 group-hover:to-purple-600/30',
    yellow: 'from-yellow-500/30 to-yellow-600/20 group-hover:from-yellow-500/40 group-hover:to-yellow-600/30',
  };

  const formattedValue = value.toLocaleString('id-ID');

  return (
    <div className="group relative bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 hover:shadow-primary-500/20 hover:shadow-2xl hover:border-primary-500/50 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      <div className="relative z-10">
        {/* Header with title and icon */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest flex-1 pr-2">{title}</p>
          {icon && (
            <div className={`flex-shrink-0 p-2.5 bg-gradient-to-br ${colorClasses[color]} rounded-lg group-hover:scale-110 transition-all duration-300 shadow-lg`}>
              <div className="text-2xl md:text-3xl filter drop-shadow-lg">{icon}</div>
            </div>
          )}
        </div>
        
        {/* Value section */}
        <div className="min-w-0 w-full">
          <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent drop-shadow-lg break-words leading-tight">
            {formattedValue}
          </p>
        </div>
      </div>
    </div>
  );
};

