import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { path: '/', label: 'Overview', icon: '📊', color: 'from-blue-500 to-cyan-500' },
  { path: '/savings', label: 'Tabungan', icon: '💰', color: 'from-green-500 to-emerald-500' },
  { path: '/loans', label: 'Pinjaman', icon: '📑', color: 'from-yellow-500 to-orange-500' },
  { path: '/targets', label: 'Target', icon: '🎯', color: 'from-purple-500 to-pink-500' },
  { path: '/profile', label: 'Profile', icon: '👤', color: 'from-indigo-500 to-blue-500' },
  { path: '/settings', label: 'Settings', icon: '⚙️', color: 'from-gray-500 to-slate-500' },
];

const MIN_WIDTH = 240;
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
      className="bg-gradient-to-b from-slate-800/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl text-white min-h-screen relative border-r border-slate-700/50 shadow-2xl overflow-hidden"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5"></div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Animated dots pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-8 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-8 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Header Section */}
      <div className="relative p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-transparent">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl ring-2 ring-primary-500/20 transform group-hover:scale-110 transition-transform duration-300 overflow-hidden bg-slate-800">
              <img 
                src="/logo.png" 
                alt="BOTAXXX Logo" 
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  // Fallback jika logo tidak ada
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<span class="text-2xl font-black text-white">B</span>';
                }}
              />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent leading-tight">
              BOTAXXX
            </h1>
            <p className="text-gray-400 text-xs mt-0.5 font-semibold tracking-wide">Financial Command</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Section */}
      <nav className="relative mt-8 px-3 space-y-1">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-4 py-3.5 rounded-2xl mx-2 mb-2 transition-all duration-500 relative overflow-hidden ${
                isActive 
                  ? `bg-gradient-to-r ${item.color} bg-opacity-20 text-white shadow-2xl shadow-primary-500/30 scale-[1.03] border-l-4 border-primary-400` 
                  : 'hover:bg-slate-700/50 text-gray-300 hover:text-white hover:scale-[1.02] hover:shadow-lg'
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Active indicator glow */}
              {isActive && (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-20 blur-2xl`}></div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-400 to-primary-600 rounded-r-full"></div>
                </>
              )}
              
              {/* Icon with gradient background */}
              <div className={`relative mr-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? `bg-gradient-to-br ${item.color} shadow-lg` 
                  : 'bg-slate-700/50 group-hover:bg-gradient-to-br group-hover:' + item.color
              }`}>
                <span className="text-xl relative z-10 group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-50 blur-md`}></div>
                )}
              </div>
              
              <span className="relative font-bold text-sm tracking-wide flex-1">{item.label}</span>
              
              {/* Active indicator arrow */}
              {isActive && (
                <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
              
              {/* Hover shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Ripple effect on click */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-active:opacity-20 group-active:bg-white group-active:animate-ping"></div>
            </Link>
          );
        })}
      </nav>
      
      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-gradient-to-t from-slate-800/80 to-transparent">
        <div className="px-4 py-3 bg-gradient-to-r from-slate-700/30 to-slate-700/10 rounded-xl border border-slate-600/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400 font-medium">System Online</span>
          </div>
        </div>
      </div>
      
      {/* Resize Handle with better styling */}
      <div
        className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-slate-600/50 via-slate-600/30 to-slate-600/50 hover:from-primary-500/60 hover:via-primary-500/40 hover:to-primary-500/60 cursor-col-resize transition-all duration-300 group"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-4 h-16 bg-gradient-to-b from-slate-600 to-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border-2 border-slate-500"></div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-1 h-8 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
  );
};
