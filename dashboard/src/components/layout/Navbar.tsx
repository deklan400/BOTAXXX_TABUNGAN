import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-gradient-to-r from-slate-800/80 via-slate-800/90 to-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between relative z-20">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-transparent"></div>
      
      <div className="flex items-center gap-3 relative z-10">
        {/* Mobile Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-white hover:bg-slate-600 transition-colors"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-lg md:text-xl font-extrabold text-white bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent">
          Dashboard
        </h2>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4 relative z-10">
        {user && (
          <>
            <div className="flex items-center space-x-2 md:space-x-3 px-2 md:px-4 py-2 bg-gradient-to-r from-slate-700/60 to-slate-700/40 backdrop-blur-sm rounded-xl border border-slate-600/50 hover:border-primary-500/50 transition-all duration-300 shadow-lg">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30 ring-2 ring-primary-500/20 text-sm md:text-base">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-100 font-semibold text-sm md:text-base hidden sm:inline">{user.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="hover:bg-red-500/10 hover:border-red-500/50 text-xs md:text-sm px-2 md:px-4">
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
