import React, { useEffect, useState } from 'react';
import { adminAPI, UserDetail } from '../api/adminAPI';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
  }, [skip]);

  // Load all users for search (without pagination)
  useEffect(() => {
    if (searchQuery) {
      loadAllUsersForSearch();
    }
  }, [searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.listUsers(skip, limit);
      setUsers(response.users);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      showMessage('error', 'Gagal memuat daftar user');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsersForSearch = async () => {
    try {
      // Load more users for search (up to 1000)
      const response = await adminAPI.listUsers(0, 1000);
      setUsers(response.users);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load users for search:', error);
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

  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(skip / limit) + 1;

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Role Management</h1>
          <p className="text-gray-400">Kelola role user: Naikkan user ke admin atau turunkan admin ke user</p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`px-4 md:px-6 py-3 md:py-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-900/50 border-green-700 text-green-200' 
            : 'bg-red-900/50 border-red-700 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-4 border border-slate-700/50">
        <div className="relative">
          <Input
            type="text"
            placeholder="Cari user (nama atau email)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSkip(0);
            }}
            className="w-full pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSkip(0);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-gray-400">Memuat data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {searchQuery ? 'Tidak ada user yang ditemukan' : 'Belum ada user'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider hidden md:table-cell">Bergabung</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {user.avatar_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover border-2 border-slate-600"
                              src={user.avatar_url}
                              alt={user.name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-600';
                                  fallback.textContent = user.name.charAt(0).toUpperCase();
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-600">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-white truncate">{user.name}</div>
                          <div className="text-xs text-gray-400 truncate">{user.email}</div>
                          <div className="text-xs text-gray-500">ID: #{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-500/50'
                            : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-500/50'
                        }`}
                      >
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300 border border-green-500/50">
                          ✓ Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/50">
                          ⚠ Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-xs text-gray-300">{formatDate(user.created_at)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {user.role === 'admin' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateRole(user.id, 'user')}
                            disabled={updating === user.id}
                            className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/50 text-blue-300 hover:text-blue-200 transition-all text-xs"
                          >
                            {updating === user.id ? (
                              <span className="flex items-center gap-1">
                                <span className="animate-spin">⏳</span> <span className="hidden sm:inline">Mengubah...</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                ⬇️ <span className="hidden sm:inline">Turunkan</span>
                              </span>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateRole(user.id, 'admin')}
                            disabled={updating === user.id}
                            className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/50 text-purple-300 hover:text-purple-200 transition-all text-xs"
                          >
                            {updating === user.id ? (
                              <span className="flex items-center gap-1">
                                <span className="animate-spin">⏳</span> <span className="hidden sm:inline">Mengubah...</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                ⬆️ <span className="hidden sm:inline">Naikkan</span>
                              </span>
                            )}
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
      </div>

      {/* Pagination */}
      {!searchQuery && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 pt-4 border-t border-slate-700">
          <div className="text-sm text-gray-400 text-center sm:text-left">
            Menampilkan <span className="font-semibold text-white">{skip + 1}</span> - <span className="font-semibold text-white">{Math.min(skip + limit, total)}</span> dari <span className="font-semibold text-white">{total}</span> user
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSkip(Math.max(0, skip - limit))}
              disabled={skip === 0 || loading}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Sebelumnya
            </Button>
            <div className="px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600">
              <span className="text-sm font-medium text-white">
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSkip(skip + limit)}
              disabled={skip + limit >= total || loading}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya →
            </Button>
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {searchQuery && filteredUsers.length > 0 && (
        <div className="text-center text-sm text-gray-400 pt-4 border-t border-slate-700">
          Ditemukan <span className="font-semibold text-white">{filteredUsers.length}</span> user yang cocok
        </div>
      )}
    </div>
  );
};

