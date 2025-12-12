import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { GoogleCallbackPage } from './pages/auth/GoogleCallbackPage';
import { OverviewPage } from './pages/OverviewPage';
import { SavingsPage } from './pages/SavingsPage';
import { LoansPage } from './pages/LoansPage';
import { TargetsPage } from './pages/TargetsPage';
import { BankAccountsPage } from './pages/BankAccountsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { DashboardLayout } from './components/layout/DashboardLayout';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <OverviewPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/savings"
        element={
          <PrivateRoute>
            <SavingsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/loans"
        element={
          <PrivateRoute>
            <LoansPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/targets"
        element={
          <PrivateRoute>
            <TargetsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/banks"
        element={
          <PrivateRoute>
            <BankAccountsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <SettingsPage />
          </PrivateRoute>
        }
      />
      {/* Admin Routes - Wrapped with DashboardLayout to show sidebar */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <DashboardLayout>
              <AdminDashboardPage />
            </DashboardLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-3xl font-bold text-white mb-4">User Management</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </DashboardLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/maintenance"
        element={
          <AdminRoute>
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-3xl font-bold text-white mb-4">Maintenance Mode</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </DashboardLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/broadcast"
        element={
          <AdminRoute>
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-3xl font-bold text-white mb-4">Broadcast Alert</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </DashboardLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/banks"
        element={
          <AdminRoute>
            <DashboardLayout>
              <div className="p-6">
                <h1 className="text-3xl font-bold text-white mb-4">Bank Management</h1>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </DashboardLayout>
          </AdminRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
