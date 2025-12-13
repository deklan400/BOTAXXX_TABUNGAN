import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AlertBell } from '../AlertBell';

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <div className="dark:bg-gradient-to-r dark:from-slate-800/80 dark:via-slate-800/90 dark:to-slate-900/80 bg-gradient-to-r bg-white from-gray-50 to-gray-100 backdrop-blur-xl dark:border-b dark:border-slate-700/50 border-b border-gray-200 shadow-2xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between relative z-20 transition-colors duration-300">
      {/* Gradient overlay */}
      <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-primary-500/5 dark:via-transparent dark:to-transparent bg-gradient-to-r from-blue-500/5 via-transparent to-transparent"></div>
      
      <div className="flex items-center gap-3 relative z-10">
        {/* Mobile Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 dark:bg-slate-700 bg-gray-200 rounded-lg flex items-center justify-center dark:text-white text-gray-900 dark:hover:bg-slate-600 hover:bg-gray-300 transition-colors"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-lg md:text-xl font-extrabold dark:text-white text-gray-900 dark:bg-gradient-to-r dark:from-white dark:via-primary-200 dark:to-primary-400 bg-gradient-to-r from-gray-900 via-blue-600 to-blue-800 bg-clip-text text-transparent">
          Dashboard
        </h2>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4 relative z-10">
        {user && (
          <>
            <AlertBell />
            <div className="flex items-center space-x-2 md:space-x-3 px-2 md:px-4 py-2 dark:bg-gradient-to-r dark:from-slate-700/60 dark:to-slate-700/40 bg-gradient-to-r from-gray-100 to-gray-200 backdrop-blur-sm rounded-xl dark:border dark:border-slate-600/50 border border-gray-300 dark:hover:border-primary-500/50 hover:border-blue-500/50 transition-all duration-300 shadow-lg">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/30 ring-2 ring-primary-500/20 text-sm md:text-base">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="dark:text-gray-100 text-gray-900 font-semibold text-sm md:text-base hidden sm:inline">{user.name}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
