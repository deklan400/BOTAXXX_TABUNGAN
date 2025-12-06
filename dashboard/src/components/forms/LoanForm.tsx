import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LoanCreateRequest, LoanUpdateRequest } from '../../api/loansAPI';

interface LoanFormProps {
  initialData?: Partial<LoanCreateRequest>;
  onSubmit: (data: LoanCreateRequest | LoanUpdateRequest) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export const LoanForm: React.FC<LoanFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    borrower_name: initialData?.borrower_name || '',
    principal: initialData?.principal?.toString() || '',
    start_date: initialData?.start_date || new Date().toISOString().split('T')[0],
    due_date: initialData?.due_date || '',
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
        borrower_name: formData.borrower_name,
        principal: parseFloat(formData.principal),
        start_date: formData.start_date,
        due_date: formData.due_date || null,
        note: formData.note || null,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save loan');
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
        label="Borrower Name"
        value={formData.borrower_name}
        onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
        required
      />

      <Input
        label="Principal Amount"
        type="number"
        step="0.01"
        value={formData.principal}
        onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
        required
      />

      <Input
        label="Start Date"
        type="date"
        value={formData.start_date}
        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
        required
      />

      <Input
        label="Due Date"
        type="date"
        value={formData.due_date}
        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
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
