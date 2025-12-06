import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { userAPI } from '../api/userAPI';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [telegramId, setTelegramId] = useState(user?.telegram_id || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) return null;

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await userAPI.updateProfile({ name, avatar_url: avatarUrl });
      await refreshUser();
      setMessage('Profile updated successfully');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTelegramId = async () => {
    setLoading(true);
    try {
      await userAPI.updateTelegramID({ telegram_id: telegramId });
      await refreshUser();
      setMessage('Telegram ID updated successfully');
    } catch (error) {
      setMessage('Failed to update Telegram ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Profile</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <Input label="Email" value={user.email} disabled />
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            <Button onClick={handleUpdateProfile} disabled={loading}>Update Profile</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Telegram Integration</h2>
          <div className="space-y-4">
            <Input label="Telegram ID" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="Your Telegram user ID" />
            <p className="text-sm text-gray-600">Set your Telegram ID to enable bot access</p>
            <Button onClick={handleUpdateTelegramId} disabled={loading}>Update Telegram ID</Button>
          </div>
        </div>

        {message && <div className={`p-4 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
      </div>
    </DashboardLayout>
  );
};

