import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  });

  return (
    <div className="flex min-h-screen dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 bg-gradient-to-br bg-gray-50 from-gray-100 to-gray-200 relative overflow-hidden transition-colors duration-300">
      {/* Background effects */}
      <div className="fixed inset-0 dark:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none"></div>
      <div className="fixed inset-0 dark:bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[linear-gradient(to_right,#e5e7eb08_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb08_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        onCollapseChange={setIsSidebarCollapsed}
      />
      <div className={`flex-1 flex flex-col relative z-10 w-full transition-all duration-300 ${isMobileSidebarOpen ? '' : isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <Navbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 dark:text-white text-gray-900 overflow-x-auto transition-colors duration-300">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
