import React, { useEffect, useState } from 'react';
import { adminAPI, UserDetail } from '../api/adminAPI';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: number, suspend: boolean) => {
    try {
      await adminAPI.suspendUser(userId, suspend);
      await loadUsers(); // Reload users
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert('Gagal mengubah status user');
    }
  };

  const handleDeleteClick = (user: UserDetail) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await adminAPI.deleteUser(userToDelete.id);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      await loadUsers(); // Reload users
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.detail || 'Gagal menghapus user');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && users.length === 0) {
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
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">Kelola semua pengguna aplikasi</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-4 border border-slate-700/50">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Cari user (nama atau email)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSkip(0); // Reset to first page when searching
            }}
            className="flex-1"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Tanggal Daftar
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    {searchQuery ? 'Tidak ada user yang ditemukan' : 'Tidak ada user'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          {user.telegram_id && (
                            <div className="text-xs text-gray-400">TG: {user.telegram_id}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-300">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'User'}
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
                        {user.is_active ? (
                          <Button
                            onClick={() => handleSuspend(user.id, true)}
                            variant="danger"
                            size="sm"
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSuspend(user.id, false)}
                            variant="success"
                            size="sm"
                          >
                            Unsuspend
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteClick(user)}
                          variant="danger"
                          size="sm"
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Menampilkan {skip + 1}-{Math.min(skip + limit, total)} dari {total} user
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setSkip(Math.max(0, skip - limit))}
                disabled={skip === 0}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setSkip(skip + limit)}
                disabled={skip + limit >= total}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        title="Konfirmasi Hapus User"
      >
        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait user ini.
          </p>
          {userToDelete && (
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                  {userToDelete.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-medium">{userToDelete.name}</div>
                  <div className="text-sm text-gray-400">{userToDelete.email}</div>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleDeleteCancel}
              variant="secondary"
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="danger"
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Hapus User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

