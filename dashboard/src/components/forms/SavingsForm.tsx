import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { SavingsCreateRequest, SavingsUpdateRequest } from '../../api/savingsAPI';

interface SavingsFormProps {
  initialData?: Partial<SavingsCreateRequest>;
  onSubmit: (data: SavingsCreateRequest | SavingsUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export const SavingsForm: React.FC<SavingsFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    type: (initialData?.type as 'IN' | 'OUT') || 'IN',
    category: initialData?.category || '',
    amount: initialData?.amount?.toString() || '',
    note: initialData?.note || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        date: formData.date,
        type: formData.type,
        category: formData.category || null,
        amount: parseFloat(formData.amount),
        note: formData.note || null,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save savings');
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

      <Input
        label="Date"
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        required
      />

      <Select
        label="Type"
        value={formData.type}
        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'IN' | 'OUT' })}
        options={[
          { value: 'IN', label: 'Income' },
          { value: 'OUT', label: 'Expense' },
        ]}
        required
      />

      <Input
        label="Category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      />

      <Input
        label="Amount"
        type="number"
        step="0.01"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        required
      />

      <Input
        label="Note"
        value={formData.note}
        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
      />

      <div className="flex space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
