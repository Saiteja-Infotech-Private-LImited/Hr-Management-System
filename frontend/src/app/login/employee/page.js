'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

const EyeIcon = ({ show, toggle }) => (
  <button type="button" onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
    {show ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )}
  </button>
);

export default function EmployeeLogin() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', {
        email: form.email,
        password: form.password,
        loginType: 'EMPLOYEE',
      });
      const data = res.data.data;
      dispatch(loginSuccess({ token: data.accessToken, user: data }));
      toast.success('Welcome ' + data.name + '!', {
        style: { background: '#1e293b', color: '#fff', borderRadius: '10px' }
      });
      router.push('/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-900">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="w-full max-w-md relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 p-10 rounded-3xl shadow-2xl flex flex-col transform transition-all duration-500 hover:scale-[1.01]">
        
        {/* Avatar */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-8 mx-auto relative group">
          <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md group-hover:blur-lg transition-all"></div>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Employee Login</h1>
          <p className="text-sm font-medium text-slate-400">Welcome back! Please sign in to continue.</p>
        </div>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span className="text-sm text-red-400 font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-5">
            <label htmlFor="emp-email" className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Email</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              <input
                id="emp-email"
                name="email" type="email" value={form.email}
                onChange={handleChange}
                placeholder="name@company.com"
                required
                className="w-full bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-3.5 pl-12 transition-all outline-none"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="emp-password" className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <input
                id="emp-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 block p-3.5 pl-12 pr-12 transition-all outline-none"
              />
              <EyeIcon show={showPassword} toggle={() => setShowPassword(!showPassword)} />
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500/50 bg-slate-900/50 cursor-pointer" />
              <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
              Forgot Password?
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full relative group overflow-hidden rounded-xl bg-blue-600 text-white font-bold text-sm px-5 py-4 transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mb-6">
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </>
              )}
            </span>
            <div className="absolute inset-0 h-full w-full bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-4 text-slate-500 font-medium">OR</span></div>
          </div>

          <button type="button" onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-slate-300 transition-all hover:text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
            Back to Selection
          </button>
        </form>
      </div>
    </div>
  );
}