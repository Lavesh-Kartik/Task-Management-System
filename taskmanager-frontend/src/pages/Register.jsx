import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Zap, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      login(data.data);
      toast.success(`Welcome to TaskFlow, ${data.data.name}! 🎉`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(ellipse at 80% 50%, rgba(91,117,243,0.07) 0%, transparent 60%)' }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gradient">TaskFlow</span>
        </div>

        <div className="card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-dark-50 mb-1">Create your account</h1>
            <p className="text-dark-500 text-sm">Start managing tasks in seconds</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="John Doe"
                  required
                  className="input pl-9"
                  autoComplete="name"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  required
                  className="input pl-9"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="input pl-9 pr-10"
                  autoComplete="new-password"
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

            <button id="register-btn" type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-dark-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
