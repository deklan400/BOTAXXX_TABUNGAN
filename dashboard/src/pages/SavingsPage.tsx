import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SavingsForm } from '../components/forms/SavingsForm';
import { savingsAPI, Savings } from '../api/savingsAPI';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDate } from '../utils/date';
import { useModal } from '../hooks/useModal';

export const SavingsPage: React.FC = () => {
  const [savings, setSavings] = useState<Savings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Savings | null>(null);
  const modal = useModal();

  useEffect(() => {
    fetchSavings();
  }, []);

  const fetchSavings = async () => {
    try {
      setError(null);
      const data = await savingsAPI.list();
      setSavings(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch savings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    await savingsAPI.create(data);
    modal.close();
    fetchSavings();
  };

  const handleUpdate = async (data: any) => {
    if (editing) {
      await savingsAPI.update(editing.id, data);
      setEditing(null);
      modal.close();
      fetchSavings();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await savingsAPI.delete(id);
      fetchSavings();
    }
  };

  const openEditModal = (item: Savings) => {
    setEditing(item);
    modal.open();
  };

  const openCreateModal = () => {
    setEditing(null);
    modal.open();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Savings (Tabungan)
            </h1>
            <p className="text-gray-400">Manage your income and expenses</p>
          </div>
          <Button onClick={openCreateModal}>+ Add Transaction</Button>
        </div>

        <Modal
          isOpen={modal.isOpen}
          onClose={() => {
            modal.close();
            setEditing(null);
          }}
          title={editing ? 'Edit Transaction' : 'Add Transaction'}
        >
          <SavingsForm
            initialData={editing || undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => {
              modal.close();
              setEditing(null);
            }}
            isEdit={!!editing}
          />
        </Modal>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded-xl">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          </div>
        ) : savings.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">No transactions yet</h3>
            <p className="text-gray-400 mb-6">Start tracking your income and expenses</p>
            <Button onClick={openCreateModal}>Add Your First Transaction</Button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Note</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/30 divide-y divide-slate-700">
                  {savings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{formatDate(item.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'IN' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {item.type === 'IN' ? '💰 Income' : '💸 Expense'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.category || '-'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                        item.type === 'IN' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {item.type === 'IN' ? '+' : '-'}{formatRupiah(item.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{item.note || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(item)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

