import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 shadow-lg px-6 py-4 flex items-center justify-between backdrop-blur-sm">
      <div className="flex items-center">
        <h2 className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Dashboard
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <>
            <div className="flex items-center space-x-3 px-4 py-2 bg-slate-700/50 rounded-lg">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-200 font-medium">{user.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
