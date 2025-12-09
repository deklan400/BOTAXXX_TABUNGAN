import React from 'react';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, children, actions }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
        <h3 className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          {title}
        </h3>
        {actions && <div>{actions}</div>}
      </div>
      <div className="text-gray-300">
        {children}
      </div>
    </div>
  );
};
