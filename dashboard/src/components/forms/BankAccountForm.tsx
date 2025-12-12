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
      const data = await banksAPI.listBanks();
      setBanks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Failed to load banks');
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
        <div className="text-gray-400">Loading banks...</div>
      ) : (
        <Select
          label="Bank"
          value={formData.bank_id}
          onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
          options={Array.isArray(banks) ? banks.map((bank) => ({
            value: bank.id.toString(),
            label: bank.name,
          })) : []}
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

