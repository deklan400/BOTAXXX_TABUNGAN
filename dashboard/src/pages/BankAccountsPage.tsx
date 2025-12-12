import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { BankAccountForm } from '../components/forms/BankAccountForm';
import { BankCard } from '../components/cards/BankCard';
import { banksAPI, BankAccount, BankAccountCreateRequest, BankAccountUpdateRequest } from '../api/banksAPI';
import { useModal } from '../hooks/useModal';

export const BankAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const modal = useModal();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setError(null);
      const data = await banksAPI.listAccounts();
      setAccounts(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gagal memuat rekening bank');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: BankAccountCreateRequest) => {
    await banksAPI.createAccount(data);
    modal.close();
    fetchAccounts();
  };

  const handleUpdate = async (data: BankAccountUpdateRequest) => {
    if (editing) {
      await banksAPI.updateAccount(editing.id, data);
      setEditing(null);
      modal.close();
      fetchAccounts();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus rekening bank ini?')) {
      try {
        await banksAPI.deleteAccount(id);
        fetchAccounts();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Gagal menghapus rekening bank');
      }
    }
  };

  const handleSetPrimary = async (id: number) => {
    try {
      await banksAPI.updateAccount(id, { is_primary: true });
      fetchAccounts();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal mengatur rekening utama');
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditing(account);
    modal.open();
  };

  const handleAddNew = () => {
    setEditing(null);
    modal.open();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Memuat rekening bank...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Rekening Bank</h1>
            <p className="text-gray-400">Kelola rekening bank Anda</p>
          </div>
          <Button onClick={handleAddNew}>
            + Tambah Rekening
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Bank Accounts Grid */}
        {accounts.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-gray-400 text-lg mb-4">Belum ada rekening bank</p>
            <Button onClick={handleAddNew} variant="outline">
              Tambah Rekening Pertama
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <BankCard
                key={account.id}
                account={account}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetPrimary={handleSetPrimary}
              />
            ))}
          </div>
        )}

        {/* Modal for Add/Edit */}
        <Modal
          isOpen={modal.isOpen}
          onClose={() => {
            modal.close();
            setEditing(null);
          }}
          title={editing ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}
        >
          <BankAccountForm
            initialData={editing ? {
              bank_id: editing.bank_id,
              account_holder_name: editing.account_holder_name,
              account_number: editing.account_number,
              is_primary: editing.is_primary,
            } : undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => {
              modal.close();
              setEditing(null);
            }}
            isEdit={!!editing}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

