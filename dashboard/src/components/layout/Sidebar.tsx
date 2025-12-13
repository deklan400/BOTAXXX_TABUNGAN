import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// SVG Icons
const BarChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const BankIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const UserManagementIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const WrenchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const menuItems = [
  { path: '/', label: 'Statistics', icon: BarChartIcon },
  { path: '/savings', label: 'Tabungan', icon: UsersIcon },
  { path: '/loans', label: 'Pinjaman', icon: TrendingUpIcon },
  { path: '/targets', label: 'Target', icon: TrophyIcon },
  { path: '/banks', label: 'Rekening Bank', icon: BankIcon },
];

const adminMenuItems = [
  { path: '/admin', label: 'Admin Dashboard', icon: ShieldIcon },
  { path: '/admin/users', label: 'User Management', icon: UserManagementIcon },
  { path: '/admin/maintenance', label: 'Maintenance', icon: WrenchIcon },
  { path: '/admin/broadcast', label: 'Broadcast Alert', icon: BellIcon },
  { path: '/admin/banks', label: 'Bank Management', icon: BankIcon },
];

const utilityItems = [
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
  { path: '/logout', label: 'Log out', icon: LogoutIcon, isAction: true },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onMobileClose, onCollapseChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Check if current route is admin route
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Don't collapse on mobile/tablet by default
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return false;
    }
    // Don't collapse if on admin route
    if (location.pathname.startsWith('/admin')) {
      return false;
    }
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== 'false'; // Default to dark mode
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Filter menu items based on search query
  const filterMenuItems = (items: typeof menuItems) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.path.toLowerCase().includes(query)
    );
  };

  const filterAdminMenuItems = (items: typeof adminMenuItems) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.path.toLowerCase().includes(query)
    );
  };

  const filterUtilityItems = (items: typeof utilityItems) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.path.toLowerCase().includes(query)
    );
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-400/30 text-yellow-200 rounded px-1">{part}</mark>
      ) : part
    );
  };

  // Auto-expand sidebar when entering admin route
  useEffect(() => {
    if (isAdminRoute && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isAdminRoute, isCollapsed]);

  useEffect(() => {
    // Only save collapse state on desktop
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // Don't save collapsed state if on admin route
      if (!isAdminRoute) {
        localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
      }
    }
    // Notify parent about collapse state change
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange, isAdminRoute]);

  // Reset collapse state on mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024 && isCollapsed) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleItemClick = (item: typeof utilityItems[0]) => {
    if (item.isAction && item.path === '/logout') {
      handleLogout();
    } else {
      navigate(item.path);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (onMobileClose && typeof window !== 'undefined' && window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  // Don't allow collapse on mobile/tablet or admin routes
  const handleToggleCollapse = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      // Prevent collapse if on admin route
      if (isAdminRoute && isCollapsed) {
        setIsCollapsed(false);
      } else if (!isAdminRoute) {
        setIsCollapsed(!isCollapsed);
      }
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`bg-slate-800 text-white h-screen border-r border-slate-700 transition-all duration-300 flex flex-col z-50
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'fixed inset-y-0 left-0' : 'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex'}
        `}
      >
      {/* Top Section - Logo and Toggle */}
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-white font-bold text-lg">B</span>';
                }
              }}
            />
          </div>
          {!isCollapsed && (
            <>
              {/* Hide collapse button on admin routes */}
              {!isAdminRoute && (
                <button
                  onClick={handleToggleCollapse}
                  className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors ml-auto hidden lg:flex"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              )}
              {/* Mobile close button */}
              {onMobileClose && (
                <button
                  onClick={onMobileClose}
                  className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors ml-auto lg:hidden"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          {isCollapsed && !isAdminRoute && (
            <button
              onClick={handleToggleCollapse}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors hidden lg:flex"
            >
              <ChevronRightIcon className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        {isCollapsed ? (
          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
        ) : (
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Q Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Items - Scrollable */}
      <nav className="py-4 flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 #1e293b' }}>
        {filterMenuItems(menuItems).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <div
              key={item.path}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && (
                  <span className="text-sm flex-1">
                    {searchQuery ? highlightText(item.label, searchQuery) : item.label}
                  </span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                {isActive && isCollapsed && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </Link>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && hoveredItem === item.path && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 pointer-events-none">
                  <div className="bg-black text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                    {item.label}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Show "No results" if search active and no matches in any menu */}
        {searchQuery && 
         filterMenuItems(menuItems).length === 0 && 
         (!user || user.role !== 'admin' || filterAdminMenuItems(adminMenuItems).length === 0) && 
         filterUtilityItems(utilityItems).length === 0 && (
          <div className="px-4 py-8 text-center">
            <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-600 opacity-50" />
            <p className="text-gray-400 text-sm">No results found</p>
            <p className="text-gray-500 text-xs mt-1">Try a different search term</p>
          </div>
        )}
        
        {/* Admin Menu Items - Only show if user is admin */}
        {user && user.role === 'admin' && (
          <>
            {!isCollapsed && filterAdminMenuItems(adminMenuItems).length > 0 && (
              <div className="px-4 py-2 mt-4 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
              </div>
            )}
            {filterAdminMenuItems(adminMenuItems).map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const Icon = item.icon;
              
              return (
                <div
                  key={item.path}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-300 hover:bg-purple-600/10 hover:text-purple-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && (
                      <span className="text-sm flex-1">
                        {searchQuery ? highlightText(item.label, searchQuery) : item.label}
                      </span>
                    )}
                    {isActive && !isCollapsed && (
                      <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full"></div>
                    )}
                    {isActive && isCollapsed && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full"></div>
                    )}
                  </Link>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && hoveredItem === item.path && (
                    <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 pointer-events-none">
                      <div className="bg-black text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                        {item.label}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </nav>

      {/* Separator */}
      <div className="border-t border-slate-700 my-2 flex-shrink-0"></div>

      {/* Utility Items */}
      <nav className="py-2 flex-shrink-0">
        {filterUtilityItems(utilityItems).map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <div
              key={item.path}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.path)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {item.isAction ? (
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center px-4 py-3 mx-2 rounded-lg transition-colors text-gray-300 hover:bg-slate-700/50 hover:text-white`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && (
                    <span className="text-sm">
                      {searchQuery ? highlightText(item.label, searchQuery) : item.label}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && (
                    <span className="text-sm">
                      {searchQuery ? highlightText(item.label, searchQuery) : item.label}
                    </span>
                  )}
                </Link>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && hoveredItem === item.path && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 pointer-events-none">
                  <div className="bg-black text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                    {item.label}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section - Dark Mode Toggle and User Profile */}
      <div className="mt-auto p-4 border-t border-slate-700 bg-slate-800 flex-shrink-0">
        {/* Dark Mode Toggle */}
        <div className={`flex items-center justify-between mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
          {!isCollapsed && <span className="text-sm text-gray-300">Dark mode</span>}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              darkMode ? 'bg-blue-600' : 'bg-slate-600'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                darkMode ? 'transform translate-x-6' : ''
              }`}
            ></div>
          </button>
        </div>

        {/* User Profile */}
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            {user ? (
              <span className="text-white font-semibold text-sm">
                {getInitials(user.name)}
              </span>
            ) : (
              <span className="text-white font-semibold text-sm">A</span>
            )}
          </div>
          {!isCollapsed && user && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
