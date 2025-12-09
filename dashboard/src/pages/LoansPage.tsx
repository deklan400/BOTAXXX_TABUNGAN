import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { LoanForm } from '../components/forms/LoanForm';
import { loansAPI, Loan } from '../api/loansAPI';
import { formatRupiah } from '../utils/formatRupiah';
import { useModal } from '../hooks/useModal';

export const LoansPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Loan | null>(null);
  const modal = useModal();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setError(null);
      const data = await loansAPI.list();
      setLoans(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    await loansAPI.create(data);
    modal.close();
    fetchLoans();
  };

  const handleUpdate = async (data: any) => {
    if (editing) {
      await loansAPI.update(editing.id, data);
      setEditing(null);
      modal.close();
      fetchLoans();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      await loansAPI.delete(id);
      fetchLoans();
    }
  };

  const openEditModal = (loan: Loan) => {
    setEditing(loan);
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
              Loans (Pinjaman)
            </h1>
            <p className="text-gray-400">Track your loans and payments</p>
          </div>
          <Button onClick={openCreateModal}>+ Add Loan</Button>
        </div>

        <Modal 
          isOpen={modal.isOpen} 
          onClose={() => { modal.close(); setEditing(null); }} 
          title={editing ? 'Edit Loan' : 'Add Loan'}
        >
          <LoanForm 
            initialData={editing || undefined} 
            onSubmit={editing ? handleUpdate : handleCreate} 
            onCancel={() => { modal.close(); setEditing(null); }} 
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
              <p className="text-gray-400">Loading loans...</p>
            </div>
          </div>
        ) : loans.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📑</div>
            <h3 className="text-xl font-bold text-white mb-2">No loans yet</h3>
            <p className="text-gray-400 mb-6">Start tracking your loans</p>
            <Button onClick={openCreateModal}>Add Your First Loan</Button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Borrower</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Principal</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Remaining</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800/30 divide-y divide-slate-700">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{loan.borrower_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{formatRupiah(loan.principal)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-yellow-400">{formatRupiah(loan.remaining_amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          loan.status === 'paid' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {loan.status === 'paid' ? '✅ Paid' : '⏳ Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(loan)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(loan.id)}>Delete</Button>
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

