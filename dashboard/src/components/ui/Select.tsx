import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3 py-2 border rounded-lg bg-slate-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-red-500' : 'border-slate-600'
        } ${className}`}
        {...props}
      >
        {Array.isArray(options) && options.length > 0 ? (
          options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-700">
              {option.label}
            </option>
          ))
        ) : (
          <option value="" className="bg-slate-700">Tidak ada pilihan</option>
        )}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};
