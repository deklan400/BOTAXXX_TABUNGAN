import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { adminAPI, UserDetail } from '../api/adminAPI';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { InfoCard } from '../components/cards/InfoCard';

export const RoleManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [updating, setUpdating] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const limit = 20;

  useEffect(() => {
    loadUsers();
  }, [skip, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.listUsers(skip, limit, searchQuery || undefined);
      setUsers(response.users);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      showMessage('error', 'Gagal memuat daftar user');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateRole = async (userId: number, newRole: 'admin' | 'user') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmMessage = `Apakah Anda yakin ingin mengubah role ${user.name} dari ${user.role} menjadi ${newRole}?`;
    if (!confirm(confirmMessage)) return;

    try {
      setUpdating(userId);
      await adminAPI.updateUserRole(userId, newRole);
      await loadUsers();
      showMessage('success', `Role ${user.name} berhasil diubah menjadi ${newRole}`);
    } catch (error: any) {
      console.error('Failed to update role:', error);
      showMessage('error', error.response?.data?.detail || 'Gagal mengubah role user');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent">
            Role Management
          </h1>
          <p className="text-gray-400">Kelola role user: Naikkan user ke admin atau turunkan admin ke user</p>
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

        {/* Search */}
        <InfoCard title="🔍 Cari User">
          <Input
            type="text"
            placeholder="Cari berdasarkan nama atau email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSkip(0);
            }}
          />
        </InfoCard>

        {/* Users Table */}
        <InfoCard title={`👥 Daftar User (Total: ${total})`}>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              <p className="mt-4 text-gray-400">Memuat data...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Tidak ada user ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role Saat Ini</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bergabung</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">#{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.is_active ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateRole(user.id, 'user')}
                              disabled={updating === user.id}
                              className="hover:bg-blue-500/10 hover:border-blue-500/50"
                            >
                              {updating === user.id ? 'Mengubah...' : '⬇️ Turunkan ke User'}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateRole(user.id, 'admin')}
                              disabled={updating === user.id}
                              className="hover:bg-purple-500/10 hover:border-purple-500/50"
                            >
                              {updating === user.id ? 'Mengubah...' : '⬆️ Naikkan ke Admin'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Menampilkan {skip + 1} - {Math.min(skip + limit, total)} dari {total} user
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkip(Math.max(0, skip - limit))}
                  disabled={skip === 0 || loading}
                >
                  ← Sebelumnya
                </Button>
                <span className="px-4 py-2 text-sm text-gray-400">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkip(skip + limit)}
                  disabled={skip + limit >= total || loading}
                >
                  Selanjutnya →
                </Button>
              </div>
            </div>
          )}
        </InfoCard>
      </div>
    </DashboardLayout>
  );
};

