import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { TargetForm } from '../components/forms/TargetForm';
import { targetsAPI, Target } from '../api/targetsAPI';
import { formatRupiah, formatDate } from '../utils';
import { useModal } from '../hooks/useModal';

export const TargetsPage: React.FC = () => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Target | null>(null);
  const modal = useModal();

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      setError(null);
      const data = await targetsAPI.list();
      setTargets(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch targets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    await targetsAPI.create(data);
    modal.close();
    fetchTargets();
  };

  const handleUpdate = async (data: any) => {
    if (editing) {
      await targetsAPI.update(editing.id, data);
      setEditing(null);
      modal.close();
      fetchTargets();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this target?')) {
      await targetsAPI.delete(id);
      fetchTargets();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Targets</h1>
          <Button onClick={() => { setEditing(null); modal.open(); }}>Add Target</Button>
        </div>

        <Modal isOpen={modal.isOpen} onClose={() => { modal.close(); setEditing(null); }} title={editing ? 'Edit Target' : 'Add Target'}>
          <TargetForm initialData={editing} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => { modal.close(); setEditing(null); }} isEdit={!!editing} />
        </Modal>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? <div className="text-center">Loading...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {targets.map((target) => {
              const progress = (target.current_amount / target.target_amount) * 100;
              return (
                <div key={target.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold mb-2">{target.name}</h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{formatRupiah(target.current_amount)}</span>
                      <span>{formatRupiah(target.target_amount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% complete</p>
                  </div>
                  {target.deadline && <p className="text-sm text-gray-600 mb-2">Deadline: {formatDate(target.deadline)}</p>}
                  <p className={`text-sm font-medium mb-4 ${target.status === 'done' ? 'text-green-600' : 'text-yellow-600'}`}>{target.status.toUpperCase()}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(target); modal.open(); }}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(target.id)}>Delete</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

