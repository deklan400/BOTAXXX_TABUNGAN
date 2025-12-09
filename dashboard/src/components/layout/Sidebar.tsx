import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/', label: 'Overview', icon: '📊' },
  { path: '/savings', label: 'Tabungan', icon: '💰' },
  { path: '/loans', label: 'Pinjaman', icon: '📑' },
  { path: '/targets', label: 'Target', icon: '🎯' },
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 256; // Default 256px (w-64)
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div
      ref={sidebarRef}
      className="bg-gradient-to-b from-slate-800/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl text-white min-h-screen relative border-r border-slate-700/50 shadow-2xl"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-xl font-bold">B</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
              BOTAXXX
            </h1>
            <p className="text-gray-400 text-xs mt-0.5 font-medium">Financial Command Center</p>
          </div>
        </div>
      </div>
      
      <nav className="relative mt-6 px-2">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-4 py-3 rounded-xl mx-2 mb-1 transition-all duration-300 relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-r from-primary-500/30 via-primary-500/20 to-primary-500/10 border-l-4 border-primary-500 text-white shadow-lg shadow-primary-500/20 scale-[1.02]' 
                  : 'hover:bg-slate-700/40 text-gray-300 hover:text-white hover:scale-[1.01]'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Active indicator glow */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-transparent blur-xl"></div>
              )}
              
              <span className="relative mr-3 text-xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
              <span className="relative font-semibold">{item.label}</span>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </Link>
          );
        })}
      </nav>
      
      {/* Resize Handle with better styling */}
      <div
        className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-slate-600 via-slate-600 to-slate-600 hover:from-primary-500 hover:via-primary-500 hover:to-primary-500 cursor-col-resize transition-all duration-300 group"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-3 h-12 bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
  );
};
