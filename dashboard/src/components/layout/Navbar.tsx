import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-gradient-to-r from-slate-800/80 via-slate-800/90 to-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl px-6 py-4 flex items-center justify-between relative z-20">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-transparent"></div>
      
      <div className="flex items-center relative z-10">
        <h2 className="text-xl font-extrabold text-white bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent">
          Dashboard
        </h2>
      </div>
      <div className="flex items-center space-x-4 relative z-10">
        {user && (
          <>
            <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-slate-700/60 to-slate-700/40 backdrop-blur-sm rounded-xl border border-slate-600/50 hover:border-primary-500/50 transition-all duration-300 shadow-lg">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30 ring-2 ring-primary-500/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-100 font-semibold">{user.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="hover:bg-red-500/10 hover:border-red-500/50">
              Logout
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
