import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { userAPI, TelegramID } from '../api/userAPI';
import { InfoCard } from '../components/cards/InfoCard';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [telegramId, setTelegramId] = useState(user?.telegram_id || '');
  const [telegramIds, setTelegramIds] = useState<TelegramID[]>([]);
  const [newTelegramId, setNewTelegramId] = useState('');
  const [newTelegramUsername, setNewTelegramUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar_url || '');
      setTelegramId(user.telegram_id || '');
      loadTelegramIDs();
    }
  }, [user]);

  const loadTelegramIDs = async () => {
    try {
      const ids = await userAPI.getTelegramIDs();
      setTelegramIds(ids);
    } catch (error) {
      console.error('Failed to load Telegram IDs:', error);
    }
  };

  if (!user) return null;

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage('');
    try {
      await userAPI.updateProfile({ name, avatar_url: avatarUrl });
      await refreshUser();
      setMessage('Profile updated successfully');
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTelegramId = async () => {
    setLoading(true);
    setMessage('');
    try {
      await userAPI.updateTelegramID({ telegram_id: telegramId });
      await refreshUser();
      setMessage('Telegram ID updated successfully');
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to update Telegram ID');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTelegramID = async () => {
    if (!newTelegramId.trim()) {
      setMessage('Telegram ID is required');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await userAPI.addTelegramID({
        telegram_id: newTelegramId,
        telegram_username: newTelegramUsername || undefined
      });
      setNewTelegramId('');
      setNewTelegramUsername('');
      await loadTelegramIDs();
      setMessage('Telegram ID added successfully');
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to add Telegram ID');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTelegramID = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Telegram ID?')) return;
    setLoading(true);
    setMessage('');
    try {
      await userAPI.deleteTelegramID(id);
      await loadTelegramIDs();
      setMessage('Telegram ID deleted successfully');
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to delete Telegram ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-white">Profile</h1>

        <InfoCard title="Profile Information">
          <div className="space-y-4">
            <Input label="Email" value={user.email} disabled />
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            <Button onClick={handleUpdateProfile} disabled={loading}>Update Profile</Button>
          </div>
        </InfoCard>

        <InfoCard title="Telegram Integration (Legacy)">
          <div className="space-y-4">
            <Input label="Telegram ID" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="Your Telegram user ID" />
            <p className="text-sm text-gray-400">Set your Telegram ID to enable bot access (legacy single ID)</p>
            <Button onClick={handleUpdateTelegramId} disabled={loading}>Update Telegram ID</Button>
          </div>
        </InfoCard>

        <InfoCard title="Multiple Telegram IDs (For Shared Accounts)">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input 
                label="New Telegram ID" 
                value={newTelegramId} 
                onChange={(e) => setNewTelegramId(e.target.value)} 
                placeholder="Enter Telegram user ID"
              />
              <Input 
                label="Telegram Username (Optional)" 
                value={newTelegramUsername} 
                onChange={(e) => setNewTelegramUsername(e.target.value)} 
                placeholder="@username"
              />
              <Button onClick={handleAddTelegramID} disabled={loading || !newTelegramId.trim()}>
                Add Telegram ID
              </Button>
            </div>

            {telegramIds.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Your Telegram IDs</h3>
                <div className="space-y-2">
                  {telegramIds.map((tgId) => (
                    <div key={tgId.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{tgId.telegram_id}</p>
                        {tgId.telegram_username && (
                          <p className="text-gray-400 text-sm">@{tgId.telegram_username}</p>
                        )}
                        <p className="text-gray-500 text-xs">
                          Added: {new Date(tgId.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteTelegramID(tgId.id)}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-400 mt-4">
              💡 Add multiple Telegram IDs to enable shared accounts. All added IDs can access your account via bot.
            </p>
          </div>
        </InfoCard>

        {message && (
          <div className={`p-4 rounded ${
            message.includes('success') 
              ? 'bg-green-900 border border-green-700 text-green-200' 
              : 'bg-red-900 border border-red-700 text-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
