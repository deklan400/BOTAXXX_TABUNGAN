import React, { useState } from 'react';
import { BankAccount } from '../../api/banksAPI';

interface BankCardProps {
  account: BankAccount;
  onEdit?: (account: BankAccount) => void;
  onDelete?: (id: number) => void;
  onSetPrimary?: (id: number) => void;
}

export const BankCard: React.FC<BankCardProps> = ({
  account,
  onEdit,
  onDelete,
  onSetPrimary,
}) => {
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const maskAccountNumber = (accountNumber: string): string => {
    if (!accountNumber || accountNumber.length <= 4) return accountNumber || '';
    const visibleStart = accountNumber.slice(0, 4);
    const visibleEnd = accountNumber.slice(-4);
    const masked = '*'.repeat(Math.max(0, accountNumber.length - 8));
    return `${visibleStart} ${masked} ${visibleEnd}`;
  };

  const getLogoPath = (logoFilename: string | null): string => {
    if (!logoFilename) return '/banks/default.png';
    return `/banks/${logoFilename}`;
  };

  const getBrandColor = (): string => {
    return account.bank?.brand_color || '#0066CC';
  };

  const displayAccountNumber = showAccountNumber
    ? (account.account_number || '')
    : maskAccountNumber(account.account_number || '');

  const brandColor = getBrandColor();
  
  return (
    <div
      className="group relative backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${brandColor}20 0%, ${brandColor}10 30%, ${brandColor}05 60%, rgba(15, 23, 42, 0.9) 100%)`,
        borderColor: `${brandColor}40`,
      }}
    >
      {/* Card Content */}
      <div className="p-6 relative z-10">
        {/* Header with Logo and Bank Name */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 rounded-xl bg-white/10 p-2 flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
              <img
                src={getLogoPath(account.bank?.logo_filename || null)}
                alt={account.bank?.name || 'Bank'}
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  // Fallback jika logo tidak ada
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && account.bank?.name) {
                    parent.innerHTML = `<span class="text-2xl font-bold text-white">${account.bank.name.charAt(0)}</span>`;
                  }
                }}
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">{account.bank?.name || 'Bank'}</h3>
              {account.is_primary && (
                <span className="text-xs text-primary-400 font-semibold">Rekening Utama</span>
              )}
            </div>
          </div>
          
          {/* Actions Menu */}
          <div className="flex items-center gap-2">
            {!account.is_primary && onSetPrimary && (
              <button
                onClick={() => onSetPrimary(account.id)}
                className="p-2 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                title="Set as Primary"
              >
                ⭐
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(account)}
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                title="Edit"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(account.id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Account Holder Name */}
        <div className="mb-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Nama Pemilik</p>
          <p className="text-white font-semibold text-lg">{account.account_holder_name}</p>
        </div>

        {/* Account Number with Toggle */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Nomor Rekening</p>
            <button
              onClick={() => setShowAccountNumber(!showAccountNumber)}
              className="text-gray-400 hover:text-white transition-colors text-sm"
              title={showAccountNumber ? 'Hide' : 'Show'}
            >
              {showAccountNumber ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <p className="text-white font-mono font-bold text-xl tracking-wider">
            {displayAccountNumber}
          </p>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-gray-500">
          <span>Ditambahkan: {new Date(account.created_at).toLocaleDateString('id-ID')}</span>
          {account.is_active ? (
            <span className="text-green-400">● Aktif</span>
          ) : (
            <span className="text-red-400">● Nonaktif</span>
          )}
        </div>
      </div>

      {/* Glow effect */}
      <div
        className="absolute -inset-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, ${brandColor}40, ${brandColor}20, ${brandColor}40)`,
        }}
      />
    </div>
  );
};

