import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Zap, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Auth() {
  const location = useLocation();
  const isLoginRoute = location.pathname !== '/register';
  const [isLogin, setIsLogin] = useState(isLoginRoute);
  
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e, mode) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data } = await authAPI.login({ email: form.email, password: form.password });
        login(data.data);
        toast.success(`Welcome back, ${data.data.name}! 👋`);
      } else {
        const { data } = await authAPI.register(form);
        login(data.data);
        toast.success(`Welcome to TaskFlow, ${data.data.name}! 🎉`);
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || `${mode === 'login' ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const nextRoute = isLogin ? '/register' : '/login';
    navigate(nextRoute, { replace: true });
    setForm({ name: '', email: '', password: '' });
    setShowPw(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Container - Fixed width for sliding panels */}
      <div className="relative w-full max-w-[900px] h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Mobile toggler (hidden on Desktop) */}
        <div className="md:hidden flex justify-center mt-4 z-50 absolute top-4 left-0 right-0">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-sm border border-slate-200">
            <button
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
              onClick={() => { if(!isLogin) toggleMode(); }}
            >
              Sign In
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
              onClick={() => { if(isLogin) toggleMode(); }}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* --- SIGN IN FORM --- */}
        <div className={`absolute top-0 left-0 w-full md:w-1/2 h-full bg-white transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${!isLogin ? 'md:translate-x-[100%] opacity-0 md:opacity-100 pointer-events-none' : 'translate-x-0 opacity-100 pointer-events-auto'}`}>
          <div className="w-full h-full flex flex-col justify-center px-8 sm:px-12 pt-16 md:pt-0">
            <div className="flex items-center gap-3 mb-8 justify-center md:justify-start">
              <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight">TaskFlow</span>
            </div>
            
            <h1 className="text-3xl font-black text-slate-800 mb-2">Welcome Back</h1>
            <p className="text-slate-500 font-medium mb-8">Sign in to your workspace</p>
            
            <form onSubmit={(e) => handleSubmit(e, 'login')} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" className="input pl-10 bg-slate-50 border-slate-200" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={set('password')} placeholder="••••••••" className="input pl-10 pr-10 bg-slate-50 border-slate-200" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-4 text-sm uppercase tracking-wide">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Sign In
              </button>
            </form>
          </div>
        </div>

        {/* --- SIGN UP FORM --- */}
        <div className={`absolute top-0 left-0 w-full md:w-1/2 h-full bg-white transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${isLogin ? 'opacity-0 pointer-events-none' : 'md:translate-x-[100%] opacity-100 pointer-events-auto'}`}>
          <div className="w-full h-full flex flex-col justify-center px-8 sm:px-12 pt-16 md:pt-0">
            <div className="flex items-center gap-3 mb-8 justify-center md:justify-start">
              <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight">TaskFlow</span>
            </div>

            <h1 className="text-3xl font-black text-slate-800 mb-2">Create Account</h1>
            <p className="text-slate-500 font-medium mb-8">Start managing tasks in seconds</p>

            <form onSubmit={(e) => handleSubmit(e, 'register')} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" required value={form.name} onChange={set('name')} placeholder="John Doe" className="input pl-10 bg-slate-50 border-slate-200" />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" className="input pl-10 bg-slate-50 border-slate-200" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="Min 6 chars" className="input pl-10 pr-10 bg-slate-50 border-slate-200" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-4 text-sm uppercase tracking-wide">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Sign Up
              </button>
            </form>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                🚀 First registered user becomes <span className="text-slate-800 font-bold">admin</span>
              </p>
            </div>
          </div>
        </div>

        {/* --- OVERLAY SECTION (Desktop Only) --- */}
        <div className={`hidden md:block absolute top-0 left-0 w-1/2 h-full z-20 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${!isLogin ? 'translate-x-0' : 'translate-x-[100%]'}`}>
          <div className="w-full h-full relative overflow-hidden pointer-events-auto bg-slate-900 shadow-2xl">
            {/* The inner track moves in the opposite direction to keep its content static relative to the parent */}
            <div className="w-[200%] h-full flex transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] absolute"
                 style={{ transform: `translateX(${!isLogin ? '0%' : '-50%'})` }}>
                 
              {/* Overlay for Register (Covers left side when Sign Up is active on right) */}
              <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 text-center relative z-10">
                <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Welcome Back!</h2>
                <p className="text-slate-300 font-medium mb-8 leading-relaxed max-w-[300px]">To keep connected with us please login with your personal info.</p>
                <button onClick={toggleMode} className="px-8 py-3 rounded-xl border-[1.5px] border-white/20 text-white font-bold tracking-wide hover:bg-white/10 transition-colors uppercase text-sm shadow-sm hover:border-white/40">
                  Sign In
                </button>
                {/* Decoration */}
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              </div>

              {/* Overlay for Login (Covers right side when Sign In is active on left) */}
              <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 text-center relative z-10">
                <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Hello, Friend!</h2>
                <p className="text-slate-300 font-medium mb-8 leading-relaxed max-w-[300px]">Enter your personal details and start your journey with TaskFlow today.</p>
                <button onClick={toggleMode} className="px-8 py-3 rounded-xl border-[1.5px] border-white/20 text-white font-bold tracking-wide hover:bg-white/10 transition-colors uppercase text-sm shadow-sm hover:border-white/40">
                  Sign Up
                </button>
                {/* Decoration */}
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
