import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { maintenanceAPI } from '../../api/maintenanceAPI';
import { MaintenancePage } from '../MaintenancePage';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<{ is_maintenance: boolean; message: string } | null>(null);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check maintenance mode
    const checkMaintenance = async () => {
      try {
        const status = await maintenanceAPI.getStatus();
        setMaintenanceStatus(status);
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
        setMaintenanceStatus({ is_maintenance: false, message: '' });
      } finally {
        setCheckingMaintenance(false);
      }
    };
    
    checkMaintenance();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Show maintenance page if maintenance is active
  if (checkingMaintenance) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (maintenanceStatus?.is_maintenance) {
    return <MaintenancePage />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {/* Animated dots */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-32 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl shadow-2xl shadow-primary-500/30 mb-4 ring-4 ring-primary-500/20 overflow-hidden bg-slate-800/50">
            <img 
              src="/logo.png" 
              alt="BOTAXXX Logo" 
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                // Fallback jika logo tidak ada
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<span class="text-4xl font-black text-white">B</span>';
              }}
            />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent">
            BOTAXXX
          </h1>
          <p className="text-gray-400 text-sm font-medium">Financial Command Center</p>
        </div>

        {/* Register Card */}
        <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Create Account</h2>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 8 characters)"
                required
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-base font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Registering...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <a 
              href="/login" 
              className="text-primary-400 hover:text-primary-300 font-semibold hover:underline transition-colors"
            >
              Login here
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Secure registration powered by BOTAXXX
        </p>
      </div>
    </div>
  );
};

