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
      <div className="space-y-4 md:space-y-6 animate-fade-in pb-6 w-full">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent">
            Role Management
          </h1>
          <p className="text-sm md:text-base text-gray-400">Kelola role user: Naikkan user ke admin atau turunkan admin ke user</p>
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

        {/* Search */}
        <InfoCard title="🔍 Cari User">
          <div className="relative">
            <Input
              type="text"
              placeholder="Cari berdasarkan nama atau email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSkip(0);
              }}
              className="pl-10"
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
        </InfoCard>

        {/* Users Table */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg overflow-hidden w-full">
          <div className="p-4 md:p-6 border-b border-slate-700/50">
            <h3 className="text-lg md:text-xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              👥 Daftar User (Total: {total})
            </h3>
          </div>
          <div className="p-4 md:p-6 w-full overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                <p className="mt-4 text-gray-400">Memuat data...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-400 text-lg">Tidak ada user ditemukan</p>
                <p className="text-gray-500 text-sm mt-2">Coba gunakan kata kunci lain untuk pencarian</p>
              </div>
            ) : (
              <>
              {/* Desktop Table View */}
              <div className="hidden md:block w-full overflow-x-auto">
                <table className="w-full min-w-[900px] divide-y divide-slate-700">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Role Saat Ini</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Bergabung</th>
                      <th className="px-4 md:px-6 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                    <tbody className="bg-slate-800/30 divide-y divide-slate-700/50">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-700/40 transition-colors">
                          <td className="px-4 md:px-6 py-4 min-w-[200px]">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 md:h-12 md:w-12">
                                {user.avatar_url ? (
                                  <img
                                    className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover border-2 border-slate-600"
                                    src={user.avatar_url}
                                    alt={user.name}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        const fallback = document.createElement('div');
                                        fallback.className = 'h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs md:text-sm border-2 border-slate-600';
                                        fallback.textContent = user.name.charAt(0).toUpperCase();
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs md:text-sm border-2 border-slate-600">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="ml-3 md:ml-4 min-w-0 flex-1">
                                <div className="text-sm font-semibold text-white truncate">{user.name}</div>
                                <div className="text-xs md:text-sm text-gray-400 truncate">{user.email}</div>
                                <div className="text-xs text-gray-500 mt-1">ID: #{user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap min-w-[120px]">
                            <span
                              className={`inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 text-xs font-bold rounded-full ${
                                user.role === 'admin'
                                  ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20'
                                  : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20'
                              }`}
                            >
                              {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap min-w-[100px]">
                            {user.is_active ? (
                              <span className="inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 text-xs font-semibold rounded-full bg-green-500/20 text-green-300 border border-green-500/50">
                                ✓ Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/50">
                                ⚠ Suspended
                              </span>
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap min-w-[150px]">
                            <div className="text-xs md:text-sm text-gray-300">{formatDate(user.created_at)}</div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap min-w-[180px]">
                            <div className="flex items-center justify-center">
                              {user.role === 'admin' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateRole(user.id, 'user')}
                                  disabled={updating === user.id}
                                  className="w-full max-w-[160px] text-xs md:text-sm bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/50 text-blue-300 hover:text-blue-200 transition-all"
                                >
                                  {updating === user.id ? (
                                    <span className="flex items-center justify-center gap-1 md:gap-2">
                                      <span className="animate-spin">⏳</span> <span className="hidden sm:inline">Mengubah...</span><span className="sm:hidden">...</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-center gap-1 md:gap-2">
                                      ⬇️ <span className="hidden sm:inline">Turunkan ke User</span><span className="sm:hidden">User</span>
                                    </span>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateRole(user.id, 'admin')}
                                  disabled={updating === user.id}
                                  className="w-full max-w-[160px] text-xs md:text-sm bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/50 text-purple-300 hover:text-purple-200 transition-all"
                                >
                                  {updating === user.id ? (
                                    <span className="flex items-center justify-center gap-1 md:gap-2">
                                      <span className="animate-spin">⏳</span> <span className="hidden sm:inline">Mengubah...</span><span className="sm:hidden">...</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-center gap-1 md:gap-2">
                                      ⬆️ <span className="hidden sm:inline">Naikkan ke Admin</span><span className="sm:hidden">Admin</span>
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 hover:bg-slate-700/40 transition-colors">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            className="h-12 w-12 rounded-full object-cover border-2 border-slate-600"
                            src={user.avatar_url}
                            alt={user.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-600';
                                fallback.textContent = user.name.charAt(0).toUpperCase();
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-600">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-white truncate">{user.name}</div>
                        <div className="text-sm text-gray-400 truncate">{user.email}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: #{user.id}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Role</div>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border-2 border-purple-500/50'
                              : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border-2 border-blue-500/50'
                          }`}
                        >
                          {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Status</div>
                        {user.is_active ? (
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full bg-green-500/20 text-green-300 border border-green-500/50">
                            ✓ Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 border border-red-500/50">
                            ⚠ Suspended
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-gray-400 mb-1">Bergabung</div>
                      <div className="text-sm text-gray-300">{formatDate(user.created_at)}</div>
                    </div>

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
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
                <div className="text-xs md:text-sm text-gray-400 text-center sm:text-left">
                  Menampilkan <span className="font-semibold text-white">{skip + 1}</span> - <span className="font-semibold text-white">{Math.min(skip + limit, total)}</span> dari <span className="font-semibold text-white">{total}</span> user
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSkip(Math.max(0, skip - limit))}
                    disabled={skip === 0 || loading}
                    className="disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                  >
                    ← <span className="hidden sm:inline">Sebelumnya</span><span className="sm:hidden">Prev</span>
                  </Button>
                  <div className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-700/50 rounded-lg border border-slate-600">
                    <span className="text-xs md:text-sm font-medium text-white">
                      {currentPage} / {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSkip(skip + limit)}
                    disabled={skip + limit >= total || loading}
                    className="disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span><span className="sm:hidden">Next</span> →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

