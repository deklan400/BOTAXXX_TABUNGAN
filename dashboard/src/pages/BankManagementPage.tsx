import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, Bank } from '../api/adminAPI';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const BankManagementPage: React.FC = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<Bank | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newBank, setNewBank] = useState({
    name: '',
    code: '',
    country: 'ID',
    brand_color: '',
    logo_background: '',
    logo_size_width: '',
    logo_size_height: '',
  });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.listBanks();
      setBanks(response.banks);
    } catch (error) {
      console.error('Failed to load banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBank = async () => {
    if (!newBank.name.trim() || !newBank.code.trim()) {
      alert('Nama dan kode bank wajib diisi');
      return;
    }

    try {
      setCreating(true);
      await adminAPI.createBank({
        name: newBank.name.trim(),
        code: newBank.code.trim().toLowerCase(),
        country: newBank.country || 'ID',
        brand_color: newBank.brand_color || undefined,
        logo_background: newBank.logo_background || undefined,
        logo_size_width: newBank.logo_size_width ? parseInt(newBank.logo_size_width) : undefined,
        logo_size_height: newBank.logo_size_height ? parseInt(newBank.logo_size_height) : undefined,
      });
      setAddModalOpen(false);
      setNewBank({
        name: '',
        code: '',
        country: 'ID',
        brand_color: '',
        logo_background: '',
        logo_size_width: '',
        logo_size_height: '',
      });
      await loadBanks();
    } catch (error: any) {
      console.error('Failed to create bank:', error);
      alert(error.response?.data?.detail || 'Gagal menambah bank');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClick = (bank: Bank) => {
    setBankToDelete(bank);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bankToDelete) return;

    try {
      setDeleting(true);
      await adminAPI.deleteBank(bankToDelete.id);
      setDeleteModalOpen(false);
      setBankToDelete(null);
      await loadBanks();
    } catch (error: any) {
      console.error('Failed to delete bank:', error);
      alert(error.response?.data?.detail || 'Gagal menghapus bank');
    } finally {
      setDeleting(false);
    }
  };

  const getLogoPath = (logoFilename: string | null) => {
    if (!logoFilename) return null;
    return `/banks/${logoFilename}`;
  };

  const filteredBanks = banks.filter(
    (bank) =>
      bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-white mb-2">Bank Management</h1>
          <p className="text-gray-400">Kelola daftar bank dan pengaturannya</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} variant="primary">
          + Tambah Bank
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-4 border border-slate-700/50">
        <Input
          type="text"
          placeholder="Cari bank (nama atau kode)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Banks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBanks.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            {searchQuery ? 'Tidak ada bank yang ditemukan' : 'Belum ada bank'}
          </div>
        ) : (
          filteredBanks.map((bank) => (
            <div
              key={bank.id}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all cursor-pointer group"
              onClick={() => navigate(`/admin/banks/${bank.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{bank.name}</h3>
                  <p className="text-xs text-gray-400">Code: {bank.code}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    bank.is_active
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {bank.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Logo Preview */}
              <div className="mb-4 flex justify-center">
                <div
                  className="w-24 h-24 rounded-xl flex items-center justify-center border-2 border-slate-600/50"
                  style={{
                    backgroundColor: bank.logo_background || bank.brand_color || '#1e293b',
                  }}
                >
                  {getLogoPath(bank.logo_filename) ? (
                    <img
                      src={getLogoPath(bank.logo_filename)!}
                      alt={bank.name}
                      className="w-full h-full object-contain p-2"
                      style={{
                        width: bank.logo_size_width ? `${bank.logo_size_width}px` : 'auto',
                        height: bank.logo_size_height ? `${bank.logo_size_height}px` : 'auto',
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-2xl font-bold text-white">${bank.name.charAt(0)}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">{bank.name.charAt(0)}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/banks/${bank.id}`);
                  }}
                  variant="primary"
                  size="sm"
                  className="flex-1"
                >
                  Kelola
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(bank);
                  }}
                  variant="danger"
                  size="sm"
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Bank Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Bank Baru"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nama Bank <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              placeholder="Contoh: BCA, Mandiri, BRI"
              value={newBank.name}
              onChange={(e) => setNewBank({ ...newBank, name: e.target.value })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Kode Bank <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              placeholder="Contoh: bca, mandiri, bri"
              value={newBank.code}
              onChange={(e) => setNewBank({ ...newBank, code: e.target.value.toLowerCase() })}
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Kode akan digunakan sebagai nama file logo</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Negara</label>
            <select
              value={newBank.country}
              onChange={(e) => setNewBank({ ...newBank, country: e.target.value })}
              className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ID">Indonesia</option>
              <option value="KH">Kamboja</option>
              <option value="SG">Singapura</option>
              <option value="MY">Malaysia</option>
              <option value="TH">Thailand</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Brand Color (Hex)</label>
            <Input
              type="text"
              placeholder="#0066CC"
              value={newBank.brand_color}
              onChange={(e) => setNewBank({ ...newBank, brand_color: e.target.value })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Logo Background (Hex)</label>
            <Input
              type="text"
              placeholder="#FFFFFF"
              value={newBank.logo_background}
              onChange={(e) => setNewBank({ ...newBank, logo_background: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo Width (px)</label>
              <Input
                type="number"
                placeholder="100"
                value={newBank.logo_size_width}
                onChange={(e) => setNewBank({ ...newBank, logo_size_width: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo Height (px)</label>
              <Input
                type="number"
                placeholder="100"
                value={newBank.logo_size_height}
                onChange={(e) => setNewBank({ ...newBank, logo_size_height: e.target.value })}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button
              onClick={() => setAddModalOpen(false)}
              variant="secondary"
              disabled={creating}
            >
              Batal
            </Button>
            <Button
              onClick={handleAddBank}
              variant="primary"
              disabled={creating}
            >
              {creating ? 'Menambah...' : 'Tambah Bank'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Konfirmasi Hapus Bank"
      >
        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Apakah Anda yakin ingin menghapus bank ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          {bankToDelete && (
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-600">
                  <span className="text-xl font-bold text-white">{bankToDelete.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-white font-medium">{bankToDelete.name}</div>
                  <div className="text-sm text-gray-400">Code: {bankToDelete.code}</div>
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setDeleteModalOpen(false)}
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
              {deleting ? 'Menghapus...' : 'Hapus Bank'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

