import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authAPI } from '../../api/authAPI';
import { maintenanceAPI } from '../../api/maintenanceAPI';
import { MaintenancePage } from '../MaintenancePage';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<{ is_maintenance: boolean; message: string } | null>(null);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    
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

  // Check for OAuth errors in URL
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get('error');
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        'oauth_cancelled': 'Google login was cancelled',
        'no_code': 'Google login failed: No authorization code received',
        'oauth_not_configured': 'Google OAuth is not configured. Please contact administrator.',
        'oauth_failed': 'Google login failed. Please try again or use email/password.',
      };
      setError(errorMessages[oauthError] || 'Google login failed');
      // Clean URL
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authAPI.getGoogleAuthUrl();
  };

  // Show maintenance page if maintenance is active
  // Note: Admin can still login because backend will allow it
  if (checkingMaintenance) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (maintenanceStatus?.is_maintenance) {
    // Show maintenance page, but admin can still try to login
    // Backend will handle the actual blocking
    return <MaintenancePage />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 animate-gradient"></div>
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'][Math.floor(Math.random() * 4)],
              animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Animated dots */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-3 h-3 bg-primary-400 rounded-full animate-pulse animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-32 w-2 h-2 bg-purple-400 rounded-full animate-pulse animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-32 w-2 h-2 bg-cyan-400 rounded-full animate-pulse animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-60 right-20 w-2.5 h-2.5 bg-pink-400 rounded-full animate-pulse animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-60 right-40 w-2 h-2 bg-green-400 rounded-full animate-pulse animate-float" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className={`relative z-10 w-full max-w-md px-4 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Logo/Brand Section */}
        <div className={`text-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '100ms' }}>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl shadow-2xl shadow-primary-500/30 mb-4 ring-4 ring-primary-500/20 overflow-hidden bg-slate-800/50 animate-float">
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
          <h1 className="text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent animate-gradient">
            BOTAXXX
          </h1>
          <p className="text-gray-400 text-sm font-medium">Financial Command Center</p>
        </div>

        {/* Login Card */}
        <div className={`bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
          <h2 className={`text-2xl font-bold mb-6 text-center text-white transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '400ms' }}>
            Welcome Back
          </h2>
          
          {error && (
            <div className={`bg-red-900/50 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 animate-slide-in transition-all duration-300`}>
              <span className="text-xl animate-pulse">⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`} style={{ transitionDelay: '500ms' }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary-500/20"
              />
            </div>
            
            <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`} style={{ transitionDelay: '600ms' }}>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full transition-all duration-300 focus:scale-[1.02] focus:shadow-lg focus:shadow-primary-500/20"
              />
            </div>

            <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '700ms' }}>
              <Button 
                type="submit" 
                className="w-full py-3 text-base font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all duration-300 hover:scale-105 active:scale-95" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className={`relative my-6 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '800ms' }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-800/95 text-gray-400 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '900ms' }}>
            <Button
              variant="outline"
              className="w-full py-3 text-base font-semibold border-2 border-slate-600 hover:border-slate-500 bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-300 hover:scale-105 active:scale-95"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Login with Google</span>
              </span>
            </Button>
          </div>

          {/* Register Link */}
          <p className={`mt-6 text-center text-sm text-gray-400 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1000ms' }}>
            Don't have an account?{' '}
            <a 
              href="/register" 
              className="text-primary-400 hover:text-primary-300 font-semibold hover:underline transition-colors hover:scale-105 inline-block"
            >
              Register here
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className={`mt-6 text-center text-xs text-gray-500 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1100ms' }}>
          Secure login powered by BOTAXXX
        </p>
      </div>
    </div>
  );
};

