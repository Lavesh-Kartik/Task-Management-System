import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Zap, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.data);
      toast.success(`Welcome back, ${data.data.name}! 👋`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(91,117,243,0.07) 0%, transparent 60%)' }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gradient">TaskFlow</span>
        </div>

        <div className="card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-dark-50 mb-1">Welcome back</h1>
            <p className="text-dark-500 text-sm">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                required
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button id="login-btn" type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-dark-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 p-3 bg-dark-800/50 rounded-lg border border-dark-700 text-center">
          <p className="text-xs text-dark-500">
            🚀 First registered user becomes <span className="text-brand-400">admin</span> automatically
          </p>
        </div>
      </div>
    </div>
  );
}
