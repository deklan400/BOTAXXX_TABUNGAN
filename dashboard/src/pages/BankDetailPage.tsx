import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, Bank, BankLogoUpdateRequest } from '../api/adminAPI';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const BankDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bank, setBank] = useState<Bank | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<BankLogoUpdateRequest>({
    brand_color: '',
    logo_background: '',
    logo_size_width: undefined,
    logo_size_height: undefined,
    is_active: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadBank();
    }
  }, [id]);

  const loadBank = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.listBanks();
      const foundBank = response.banks.find((b) => b.id === parseInt(id || '0'));
      if (foundBank) {
        setBank(foundBank);
        setSettings({
          brand_color: foundBank.brand_color || '',
          logo_background: foundBank.logo_background || '',
          logo_size_width: foundBank.logo_size_width || undefined,
          logo_size_height: foundBank.logo_size_height || undefined,
          is_active: foundBank.is_active,
        });
      } else {
        alert('Bank tidak ditemukan');
        navigate('/admin/banks');
      }
    } catch (error) {
      console.error('Failed to load bank:', error);
      alert('Gagal memuat data bank');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !bank) return;

    try {
      setUploading(true);
      await adminAPI.updateBankLogo(bank.id, logoFile);
      setLogoFile(null);
      setLogoPreview(null);
      await loadBank();
      alert('Logo berhasil diupload');
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      alert(error.response?.data?.detail || 'Gagal mengupload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!bank) return;

    try {
      setSaving(true);
      await adminAPI.updateBankSettings(bank.id, {
        brand_color: settings.brand_color || undefined,
        logo_background: settings.logo_background || undefined,
        logo_size_width: settings.logo_size_width,
        logo_size_height: settings.logo_size_height,
        is_active: settings.is_active,
      });
      await loadBank();
      alert('Pengaturan berhasil disimpan');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      alert(error.response?.data?.detail || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const getLogoPath = (logoFilename: string | null) => {
    if (!logoFilename) return null;
    return `/banks/${logoFilename}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!bank) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/banks')}
            className="text-gray-400 hover:text-white mb-2 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Daftar Bank
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Pengaturan Bank: {bank.name}</h1>
          <p className="text-gray-400">Kelola logo, warna, dan pengaturan bank</p>
        </div>
      </div>

      {/* Logo Section */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Logo Bank</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Preview Logo</label>
            <div
              className="w-full h-48 rounded-xl flex items-center justify-center border-2 border-slate-600/50 mb-4"
              style={{
                backgroundColor: settings.logo_background || settings.brand_color || '#1e293b',
              }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain p-4"
                  style={{
                    width: settings.logo_size_width ? `${settings.logo_size_width}px` : 'auto',
                    height: settings.logo_size_height ? `${settings.logo_size_height}px` : 'auto',
                  }}
                />
              ) : getLogoPath(bank.logo_filename) ? (
                <img
                  src={getLogoPath(bank.logo_filename)!}
                  alt={bank.name}
                  className="max-w-full max-h-full object-contain p-4"
                  style={{
                    width: settings.logo_size_width || bank.logo_size_width
                      ? `${settings.logo_size_width || bank.logo_size_width}px`
                      : 'auto',
                    height: settings.logo_size_height || bank.logo_size_height
                      ? `${settings.logo_size_height || bank.logo_size_height}px`
                      : 'auto',
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-4xl font-bold text-white">${bank.name.charAt(0)}</span>`;
                    }
                  }}
                />
              ) : (
                <span className="text-4xl font-bold text-white">{bank.name.charAt(0)}</span>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Upload Logo Baru</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFileChange}
              className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            />
            {logoFile && (
              <Button
                onClick={handleUploadLogo}
                disabled={uploading}
                variant="primary"
                className="w-full"
              >
                {uploading ? 'Mengupload...' : 'Upload Logo'}
              </Button>
            )}
            {bank.logo_filename && (
              <p className="text-xs text-gray-400 mt-2">
                Logo saat ini: {bank.logo_filename}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Pengaturan</h2>

        <div className="space-y-4">
          {/* Brand Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Brand Color (Hex)</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="#0066CC"
                value={settings.brand_color}
                onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                className="flex-1"
              />
              {settings.brand_color && (
                <div
                  className="w-12 h-12 rounded-lg border border-slate-600"
                  style={{ backgroundColor: settings.brand_color }}
                />
              )}
            </div>
          </div>

          {/* Logo Background */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Logo Background (Hex)</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="#FFFFFF"
                value={settings.logo_background}
                onChange={(e) => setSettings({ ...settings, logo_background: e.target.value })}
                className="flex-1"
              />
              {settings.logo_background && (
                <div
                  className="w-12 h-12 rounded-lg border border-slate-600"
                  style={{ backgroundColor: settings.logo_background }}
                />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Warna latar belakang untuk logo (jika kosong akan menggunakan brand color)
            </p>
          </div>

          {/* Logo Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo Width (px)</label>
              <Input
                type="number"
                placeholder="100"
                value={settings.logo_size_width || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    logo_size_width: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo Height (px)</label>
              <Input
                type="number"
                placeholder="100"
                value={settings.logo_size_height || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    logo_size_height: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_active}
                onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-300">Bank Aktif</span>
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Bank yang tidak aktif tidak akan muncul di daftar pilihan user
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            variant="primary"
            className="min-w-[150px]"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </div>

      {/* Bank Info */}
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-4">Informasi Bank</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Nama</p>
            <p className="text-white font-medium">{bank.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Kode</p>
            <p className="text-white font-medium">{bank.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Negara</p>
            <p className="text-white font-medium">{bank.country}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Status</p>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                bank.is_active
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {bank.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

