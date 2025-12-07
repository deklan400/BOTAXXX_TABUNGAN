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
          <h1 className="text-3xl font-bold">Savings (Tabungan)</h1>
          <Button onClick={openCreateModal}>Add Transaction</Button>
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savings.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${item.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatRupiah(item.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.note || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(item)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

