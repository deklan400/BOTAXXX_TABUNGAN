import React from 'react';

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, children, actions }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  );
};
