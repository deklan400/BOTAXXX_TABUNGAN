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
      className="bg-slate-800 text-white min-h-screen relative border-r border-slate-700"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="p-6">
        <h1 className="text-2xl font-bold">BOTAXXX</h1>
        <p className="text-gray-400 text-sm mt-1">Financial Command Center</p>
      </div>
      <nav className="mt-8">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 hover:bg-slate-700 transition-colors ${
                isActive ? 'bg-slate-700 border-l-4 border-primary-500' : ''
              }`}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full bg-slate-600 hover:bg-primary-500 cursor-col-resize transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      />
    </div>
  );
};
