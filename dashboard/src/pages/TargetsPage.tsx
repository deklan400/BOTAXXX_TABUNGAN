import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { TargetForm } from '../components/forms/TargetForm';
import { targetsAPI, Target } from '../api/targetsAPI';
import { formatRupiah } from '../utils/formatRupiah';
import { formatDate } from '../utils/date';
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

  const openEditModal = (target: Target) => {
    setEditing(target);
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
              Targets
            </h1>
            <p className="text-gray-400">Set and track your financial goals</p>
          </div>
          <Button onClick={openCreateModal}>+ Add Target</Button>
        </div>

        <Modal 
          isOpen={modal.isOpen} 
          onClose={() => { modal.close(); setEditing(null); }} 
          title={editing ? 'Edit Target' : 'Add Target'}
        >
          <TargetForm 
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
              <p className="text-gray-400">Loading targets...</p>
            </div>
          </div>
        ) : targets.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">No targets yet</h3>
            <p className="text-gray-400 mb-6">Set your first financial goal</p>
            <Button onClick={openCreateModal}>Add Your First Target</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {targets.map((target) => {
              const progress = (target.current_amount / target.target_amount) * 100;
              const isComplete = progress >= 100;
              return (
                <div 
                  key={target.id} 
                  className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg p-6 hover:shadow-xl hover:border-primary-500/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{target.name}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      target.status === 'done' || isComplete
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {target.status === 'done' || isComplete ? '✅ Done' : '⏳ Active'}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-semibold">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          isComplete 
                            ? 'bg-gradient-to-r from-green-500 to-green-400' 
                            : 'bg-gradient-to-r from-primary-500 to-primary-400'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-2 text-gray-400">
                      <span>{formatRupiah(target.current_amount)}</span>
                      <span>{formatRupiah(target.target_amount)}</span>
                    </div>
                  </div>
                  
                  {target.deadline && (
                    <p className="text-sm text-gray-400 mb-4">
                      📅 Deadline: <span className="text-white">{formatDate(target.deadline)}</span>
                    </p>
                  )}
                  
                  <div className="flex space-x-2 pt-4 border-t border-slate-700/50">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openEditModal(target)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => handleDelete(target.id)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
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

