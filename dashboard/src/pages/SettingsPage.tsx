import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { InfoCard } from '../components/cards/InfoCard';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/authAPI';
import axiosClient from '../api/axiosClient';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences
  const [currency, setCurrency] = useState('IDR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [language, setLanguage] = useState('id');

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [telegramNotifications, setTelegramNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // Note: Backend needs to implement password change endpoint
      // For now, we'll show a message
      showMessage('success', 'Password change feature coming soon. Please contact support.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      // Export all user data
      const [savings, loans, targets] = await Promise.all([
        axiosClient.get('/savings'),
        axiosClient.get('/loans'),
        axiosClient.get('/targets'),
      ]);

      const data = {
        user: user,
        exportDate: new Date().toISOString(),
        savings: savings.data,
        loans: loans.data,
        targets: targets.data,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `botaxxx-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'Data exported successfully');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return;
    }

    if (!confirm('This is your last chance. Are you absolutely sure?')) {
      return;
    }

    setLoading(true);
    try {
      // Note: Backend needs to implement account deletion endpoint
      showMessage('error', 'Account deletion feature coming soon. Please contact support.');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = () => {
    // Save to localStorage
    localStorage.setItem('currency', currency);
    localStorage.setItem('dateFormat', dateFormat);
    localStorage.setItem('language', language);
    localStorage.setItem('emailNotifications', emailNotifications.toString());
    localStorage.setItem('telegramNotifications', telegramNotifications.toString());
    localStorage.setItem('transactionAlerts', transactionAlerts.toString());
    showMessage('success', 'Preferences saved successfully');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-5xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-400 text-lg">Manage your account settings and preferences</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`px-6 py-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-green-900/50 border-green-700 text-green-200' 
              : 'bg-red-900/50 border-red-700 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Account Settings */}
        <InfoCard title="🔐 Account Security">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </InfoCard>

        {/* Display Preferences */}
        <InfoCard title="🎨 Display Preferences">
          <div className="space-y-4">
            <Select
              label="Currency Format"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'IDR', label: 'IDR (Rp)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
              ]}
            />
            <Select
              label="Date Format"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              options={[
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g., 31/12/2024)' },
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g., 12/31/2024)' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g., 2024-12-31)' },
                { value: 'DD MMM YYYY', label: 'DD MMM YYYY (e.g., 31 Dec 2024)' },
              ]}
            />
            <Select
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              options={[
                { value: 'id', label: 'Bahasa Indonesia' },
                { value: 'en', label: 'English' },
              ]}
            />
            <Button onClick={handleSavePreferences} disabled={loading}>
              Save Preferences
            </Button>
          </div>
        </InfoCard>

        {/* Notification Settings */}
        <InfoCard title="🔔 Notification Settings">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div>
                <p className="font-semibold text-white">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div>
                <p className="font-semibold text-white">Telegram Notifications</p>
                <p className="text-sm text-gray-400">Receive notifications via Telegram bot</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramNotifications}
                  onChange={(e) => setTelegramNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div>
                <p className="font-semibold text-white">Transaction Alerts</p>
                <p className="text-sm text-gray-400">Get alerts for large transactions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={transactionAlerts}
                  onChange={(e) => setTransactionAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <Button onClick={handleSavePreferences} disabled={loading}>
              Save Notification Settings
            </Button>
          </div>
        </InfoCard>

        {/* Data Management */}
        <InfoCard title="💾 Data Management">
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Export Your Data</h3>
              <p className="text-sm text-gray-400 mb-4">Download all your financial data in JSON format</p>
              <Button variant="outline" onClick={handleExportData} disabled={loading}>
                {loading ? 'Exporting...' : '📥 Export Data'}
              </Button>
            </div>

            <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
              <h3 className="font-semibold text-red-300 mb-2">⚠️ Danger Zone</h3>
              <p className="text-sm text-red-400 mb-4">Permanently delete your account and all associated data</p>
              <Button variant="danger" onClick={handleDeleteAccount} disabled={loading}>
                {loading ? 'Deleting...' : '🗑️ Delete Account'}
              </Button>
            </div>
          </div>
        </InfoCard>

        {/* Account Information */}
        <InfoCard title="ℹ️ Account Information">
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
              <span className="text-gray-400">Account ID</span>
              <span className="text-white font-mono">{user?.id}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
              <span className="text-gray-400">Email</span>
              <span className="text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </InfoCard>
      </div>
    </DashboardLayout>
  );
};

