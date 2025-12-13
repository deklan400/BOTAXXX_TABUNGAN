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

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            <p className="mt-4 text-gray-400">Memuat data...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            {searchQuery ? 'Tidak ada user yang ditemukan' : 'Belum ada user'}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">{user.name}</h3>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">ID: #{user.id}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                    user.is_active
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {user.is_active ? 'Aktif' : 'Suspended'}
                </span>
              </div>

              {/* Avatar */}
              <div className="mb-4 flex justify-center">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center border-2 border-slate-600/50 bg-gradient-to-br from-primary-500/20 to-primary-600/20">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-full h-full rounded-xl object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-3xl font-bold text-white">${user.name.charAt(0).toUpperCase()}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-3xl font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>

              {/* Role Badge */}
              <div className="mb-4 flex justify-center">
                <span
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20'
                      : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20'
                  }`}
                >
                  {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                </span>
              </div>

              {/* Join Date */}
              <div className="mb-4 text-center">
                <p className="text-xs text-gray-400">Bergabung</p>
                <p className="text-sm text-gray-300">{formatDate(user.created_at)}</p>
              </div>

              {/* Action Button */}
              <div className="w-full">
                {user.role === 'admin' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateRole(user.id, 'user')}
                    disabled={updating === user.id}
                    className="w-full bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/50 text-blue-300 hover:text-blue-200 transition-all"
                  >
                    {updating === user.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span> Mengubah...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        ⬇️ Turunkan ke User
                      </span>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateRole(user.id, 'admin')}
                    disabled={updating === user.id}
                    className="w-full bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/50 text-purple-300 hover:text-purple-200 transition-all"
                  >
                    {updating === user.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span> Mengubah...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        ⬆️ Naikkan ke Admin
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))
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

