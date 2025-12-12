import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { banksAPI, Bank, BankAccountCreateRequest, BankAccountUpdateRequest } from '../../api/banksAPI';

interface BankAccountFormProps {
  initialData?: Partial<BankAccountCreateRequest>;
  onSubmit: (data: BankAccountCreateRequest | BankAccountUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export const BankAccountForm: React.FC<BankAccountFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [formData, setFormData] = useState({
    bank_id: initialData?.bank_id?.toString() || '',
    account_holder_name: initialData?.account_holder_name || '',
    account_number: initialData?.account_number || '',
    is_primary: initialData?.is_primary || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setError('');
      const data = await banksAPI.listBanks();
      console.log('Banks loaded:', data); // Debug log
      if (Array.isArray(data) && data.length > 0) {
        setBanks(data);
      } else {
        setError('Tidak ada bank tersedia. Pastikan database sudah di-seed.');
        setBanks([]);
      }
    } catch (err: any) {
      console.error('Error loading banks:', err); // Debug log
      const errorMsg = err.response?.data?.detail || err.message || 'Gagal memuat daftar bank';
      setError(`Error: ${errorMsg}. Pastikan backend API berjalan dan database sudah di-seed.`);
      setBanks([]); // Set empty array on error
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData: BankAccountCreateRequest | BankAccountUpdateRequest = {
        bank_id: parseInt(formData.bank_id),
        account_holder_name: formData.account_holder_name,
        account_number: formData.account_number,
        ...(isEdit ? {} : { is_primary: formData.is_primary }),
      };
      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save bank account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loadingBanks ? (
        <div className="text-gray-400">Memuat daftar bank...</div>
      ) : banks.length === 0 ? (
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg">
          <p className="font-semibold mb-1">Tidak ada bank tersedia</p>
          <p className="text-sm">Pastikan:</p>
          <ul className="text-sm list-disc list-inside mt-1">
            <li>Backend API berjalan dengan baik</li>
            <li>Database sudah di-seed dengan data bank</li>
            <li>Jalankan: <code className="bg-slate-800 px-1 rounded">python -m app.db.seed_banks</code></li>
          </ul>
        </div>
      ) : (
        <Select
          label="Bank"
          value={formData.bank_id}
          onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
          options={[
            { value: '', label: '-- Pilih Bank --' },
            ...banks.map((bank) => ({
              value: bank.id.toString(),
              label: bank.name,
            }))
          ]}
          required
        />
      )}

      <Input
        label="Nama Pemilik Rekening"
        value={formData.account_holder_name}
        onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
        required
        placeholder="Masukkan nama sesuai rekening"
      />

      <Input
        label="Nomor Rekening"
        value={formData.account_number}
        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
        required
        placeholder="Masukkan nomor rekening"
      />

      {!isEdit && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_primary"
            checked={formData.is_primary}
            onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
            className="w-4 h-4 text-primary-600 bg-slate-700 border-slate-600 rounded focus:ring-primary-500"
          />
          <label htmlFor="is_primary" className="text-gray-300 text-sm">
            Set sebagai rekening utama
          </label>
        </div>
      )}

      <div className="flex space-x-2">
        <Button type="submit" disabled={loading || loadingBanks}>
          {loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Tambah'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </form>
  );
};

