import React, { useEffect, useState } from 'react';
import { adminAPI, MaintenanceModeResponse } from '../api/adminAPI';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const MaintenanceModePage: React.FC = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceModeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    loadMaintenanceStatus();
  }, []);

  const loadMaintenanceStatus = async () => {
    try {
      setLoading(true);
      const status = await adminAPI.getMaintenanceMode();
      setMaintenance(status);
      setEnabled(status.is_maintenance);
      setMessage(status.message || '');
    } catch (error) {
      console.error('Failed to load maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setSaving(true);
      const newStatus = !enabled;
      await adminAPI.setMaintenanceMode({
        enabled: newStatus,
        message: newStatus ? message || 'System is under maintenance. Please try again later.' : undefined,
      });
      setEnabled(newStatus);
      await loadMaintenanceStatus();
    } catch (error: any) {
      console.error('Failed to update maintenance mode:', error);
      alert(error.response?.data?.detail || 'Gagal mengubah maintenance mode');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMessage = async () => {
    if (!enabled || !message.trim()) return;
    
    try {
      setSaving(true);
      await adminAPI.setMaintenanceMode({
        enabled: true,
        message: message.trim(),
      });
      await loadMaintenanceStatus();
      alert('Pesan berhasil diperbarui');
    } catch (error: any) {
      console.error('Failed to update maintenance message:', error);
      alert(error.response?.data?.detail || 'Gagal memperbarui pesan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Maintenance Mode</h1>
          <p className="text-gray-400">Aktifkan maintenance mode untuk memblokir akses user non-admin</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Status Maintenance</h2>
            <p className="text-gray-400 text-sm">
              {enabled
                ? 'Maintenance mode sedang aktif. User non-admin tidak dapat mengakses aplikasi.'
                : 'Maintenance mode tidak aktif. Semua user dapat mengakses aplikasi.'}
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-lg font-semibold ${
              enabled
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}
          >
            {enabled ? 'AKTIF' : 'TIDAK AKTIF'}
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-4 mb-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={handleToggle}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">
              {enabled ? 'Nonaktifkan Maintenance Mode' : 'Aktifkan Maintenance Mode'}
            </span>
          </label>
        </div>

        {/* Message Input */}
        {enabled && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pesan Maintenance (opsional)
            </label>
            <Input
              type="text"
              placeholder="Masukkan pesan yang akan ditampilkan ke user..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-2">
              Pesan ini akan ditampilkan kepada user non-admin saat maintenance mode aktif.
            </p>
            {message && (
              <Button
                onClick={handleUpdateMessage}
                disabled={saving}
                variant="primary"
                className="mt-4"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pesan'}
              </Button>
            )}
          </div>
        )}

        {/* Current Message Display */}
        {maintenance?.is_maintenance && maintenance.message && (
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
            <p className="text-sm font-medium text-gray-300 mb-1">Pesan Saat Ini:</p>
            <p className="text-white">{maintenance.message}</p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
        <h3 className="text-lg font-semibold text-white mb-3">ℹ️ Informasi</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Maintenance mode akan memblokir akses semua user non-admin ke aplikasi</li>
          <li>• Admin tetap dapat mengakses aplikasi meskipun maintenance mode aktif</li>
          <li>• User non-admin akan melihat halaman maintenance dengan pesan yang Anda tentukan</li>
          <li>• Pastikan untuk menonaktifkan maintenance mode setelah selesai</li>
        </ul>
      </div>
    </div>
  );
};

