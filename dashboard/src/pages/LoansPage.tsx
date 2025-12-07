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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Loans (Pinjaman)</h1>
          <Button onClick={() => { setEditing(null); modal.open(); }}>Add Loan</Button>
        </div>

        <Modal isOpen={modal.isOpen} onClose={() => { modal.close(); setEditing(null); }} title={editing ? 'Edit Loan' : 'Add Loan'}>
          <LoanForm initialData={editing || undefined} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => { modal.close(); setEditing(null); }} isEdit={!!editing} />
        </Modal>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? <div className="text-center">Loading...</div> : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Borrower</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{loan.borrower_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatRupiah(loan.principal)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatRupiah(loan.remaining_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-full ${loan.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{loan.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(loan); modal.open(); }}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(loan.id)}>Delete</Button>
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

