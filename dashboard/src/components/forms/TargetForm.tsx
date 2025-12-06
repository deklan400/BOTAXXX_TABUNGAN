import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TargetCreateRequest, TargetUpdateRequest } from '../../api/targetsAPI';

interface TargetFormProps {
  initialData?: Partial<TargetCreateRequest>;
  onSubmit: (data: TargetCreateRequest | TargetUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export const TargetForm: React.FC<TargetFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    target_amount: initialData?.target_amount?.toString() || '',
    current_amount: initialData?.current_amount?.toString() || '0',
    deadline: initialData?.deadline || '',
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
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount),
        deadline: formData.deadline || null,
        note: formData.note || null,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save target');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        label="Target Amount"
        type="number"
        step="0.01"
        value={formData.target_amount}
        onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
        required
      />

      <Input
        label="Current Amount"
        type="number"
        step="0.01"
        value={formData.current_amount}
        onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
        required
      />

      <Input
        label="Deadline"
        type="date"
        value={formData.deadline}
        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
