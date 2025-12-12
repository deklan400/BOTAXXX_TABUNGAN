import React, { useState, useEffect } from 'react';
import { adminAPI, BroadcastAlertRequest } from '../api/adminAPI';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

interface BroadcastHistory {
  message: string;
  title?: string;
  sent_at: string;
  users_count: number;
}

export const BroadcastAlertPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [lastBroadcast, setLastBroadcast] = useState<BroadcastHistory | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await adminAPI.getStats();
      setTotalUsers(stats.active_users);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Pesan tidak boleh kosong');
      return;
    }

    if (message.length > 1000) {
      alert('Pesan terlalu panjang (maksimal 1000 karakter)');
      return;
    }

    if (title && title.length > 200) {
      alert('Judul terlalu panjang (maksimal 200 karakter)');
      return;
    }

    setConfirmModalOpen(true);
  };

  const handleConfirmSend = async () => {
    try {
      setSending(true);
      setConfirmModalOpen(false);

      const request: BroadcastAlertRequest = {
        message: message.trim(),
        title: title.trim() || undefined,
      };

      const response = await adminAPI.broadcastAlert(request);

      // Save to history
      setLastBroadcast({
        message: response.content,
        title: title.trim() || undefined,
        sent_at: new Date().toISOString(),
        users_count: response.users_count,
      });

      // Clear form
      setTitle('');
      setMessage('');

      setSuccessModalOpen(true);
    } catch (error: any) {
      console.error('Failed to send broadcast:', error);
      alert(error.response?.data?.detail || 'Gagal mengirim broadcast');
    } finally {
      setSending(false);
    }
  };

  const characterCount = message.length;
  const titleCount = title.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Broadcast Alert</h1>
          <p className="text-gray-400">Kirim notifikasi ke semua user aktif</p>
        </div>
      </div>

      {/* Stats Card */}
      {totalUsers !== null && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total User Aktif</p>
              <p className="text-2xl font-bold text-white">{totalUsers.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Buat Broadcast Alert</h2>

        {/* Title Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Judul (Opsional)
          </label>
          <Input
            type="text"
            placeholder="Masukkan judul alert..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-400">Judul akan ditampilkan sebagai header alert</p>
            <p className={`text-xs ${titleCount > 200 ? 'text-red-400' : 'text-gray-400'}`}>
              {titleCount}/200
            </p>
          </div>
        </div>

        {/* Message Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pesan <span className="text-red-400">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Masukkan pesan yang akan dikirim ke semua user..."
            rows={8}
            maxLength={1000}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-400">Pesan wajib diisi</p>
            <p className={`text-xs ${characterCount > 1000 ? 'text-red-400' : characterCount > 800 ? 'text-yellow-400' : 'text-gray-400'}`}>
              {characterCount}/1000
            </p>
          </div>
        </div>

        {/* Preview */}
        {message.trim() && (
          <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <p className="text-sm font-medium text-gray-300 mb-2">Preview:</p>
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
              {title.trim() && (
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              )}
              <p className="text-gray-300 whitespace-pre-wrap">{message}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || sending}
            variant="primary"
            className="min-w-[150px]"
          >
            {sending ? 'Mengirim...' : 'Kirim Broadcast'}
          </Button>
        </div>
      </div>

      {/* Last Broadcast History */}
      {lastBroadcast && (
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Broadcast Terakhir</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Dikirim pada</p>
              <p className="text-sm text-white">
                {new Date(lastBroadcast.sent_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Dikirim ke</p>
              <p className="text-sm font-semibold text-green-400">
                {lastBroadcast.users_count.toLocaleString('id-ID')} user
              </p>
            </div>
            {lastBroadcast.title && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Judul</p>
                <p className="text-white font-medium">{lastBroadcast.title}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400 mb-1">Pesan</p>
              <p className="text-white whitespace-pre-wrap">{lastBroadcast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/20">
        <h3 className="text-lg font-semibold text-white mb-3">⚠️ Informasi Penting</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Broadcast akan dikirim ke semua user aktif ({totalUsers?.toLocaleString('id-ID') || 'N/A'} user)</li>
          <li>• Pastikan pesan jelas dan informatif</li>
          <li>• Gunakan judul untuk menarik perhatian user</li>
          <li>• Broadcast tidak dapat dibatalkan setelah dikirim</li>
          <li>• Pastikan untuk memeriksa preview sebelum mengirim</li>
        </ul>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Konfirmasi Broadcast"
      >
        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Apakah Anda yakin ingin mengirim broadcast alert ini ke semua user aktif?
          </p>
          {totalUsers !== null && (
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">Akan dikirim ke:</p>
              <p className="text-xl font-bold text-white">{totalUsers.toLocaleString('id-ID')} user aktif</p>
            </div>
          )}
          {title.trim() && (
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">Judul:</p>
              <p className="text-white font-medium">{title}</p>
            </div>
          )}
          <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-400 mb-1">Pesan:</p>
            <p className="text-white whitespace-pre-wrap">{message}</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setConfirmModalOpen(false)}
              variant="secondary"
              disabled={sending}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmSend}
              variant="primary"
              disabled={sending}
            >
              {sending ? 'Mengirim...' : 'Ya, Kirim Sekarang'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Broadcast Berhasil Dikirim"
      >
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-300 mb-2">
              Broadcast alert berhasil dikirim!
            </p>
            {lastBroadcast && (
              <p className="text-sm text-gray-400">
                Dikirim ke {lastBroadcast.users_count.toLocaleString('id-ID')} user aktif
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setSuccessModalOpen(false)}
              variant="primary"
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

