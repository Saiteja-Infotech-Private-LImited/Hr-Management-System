'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function AdminLogin() {
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
        loginType: 'ADMIN',
      });
      const data = res.data.data;
      dispatch(loginSuccess({ token: data.accessToken, user: data }));
      toast.success('Welcome ' + data.name + '!');
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show, toggle }) => (
    <button type="button" onClick={toggle}
      style={{
        position: 'absolute', right: '12px',
        top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none',
        cursor: 'pointer', padding: '0',
        display: 'flex', alignItems: 'center',
      }}>
      {show ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(160deg, #dcfce7 0%, #f0fdf4 45%, #ffffff 100%)',
    }}>
      <div style={{
        background: 'white', borderRadius: '28px',
        padding: '40px 36px', width: '100%', maxWidth: '420px',
        boxShadow: '0 8px 40px rgba(22,163,74,0.12)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Wave + Avatar */}
        <div style={{
          width: '100%', height: '120px', borderRadius: '16px',
          background: 'linear-gradient(160deg, #dcfce7, #f0fdf4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '120px', height: '120px', background: 'rgba(22,163,74,0.08)', borderRadius: '50%' }}/>
          <div style={{ position: 'absolute', top: '-30px', right: '-10px', width: '100px', height: '100px', background: 'rgba(22,163,74,0.06)', borderRadius: '50%' }}/>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(22,163,74,0.2)', position: 'relative', zIndex: 1,
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="#16a34a">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
          Admin / HR Login
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
          Welcome back! Please sign in to continue
        </p>

        {/* Error */}
        {error && (
          <div style={{
            width: '100%', background: '#fef2f2',
            border: '1.5px solid #fca5a5', borderRadius: '12px',
            padding: '10px 14px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '500' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Admin Email
            </label>
            <div style={{ position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <input
                name="email" type="email" value={form.email}
                onChange={handleChange}
                placeholder="Enter your admin email"
                required
                style={{
                  width: '100%', padding: '12px 14px 12px 38px',
                  border: form.email ? '2.5px solid #16a34a' : '2px solid #e2e8f0',
                  borderRadius: '12px', fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box', transition: 'all 0.2s',
                  boxShadow: form.email ? '0 0 0 3px rgba(22,163,74,0.1)' : 'none',
                }}
                onFocus={e => { e.target.style.border = '2.5px solid #16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)'; }}
                onBlur={e => { if (!form.email) { e.target.style.border = '2px solid #e2e8f0'; e.target.style.boxShadow = 'none'; } }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%', padding: '12px 40px 12px 38px',
                  border: form.password ? '2.5px solid #16a34a' : '2px solid #e2e8f0',
                  borderRadius: '12px', fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box', transition: 'all 0.2s',
                  boxShadow: form.password ? '0 0 0 3px rgba(22,163,74,0.1)' : 'none',
                }}
                onFocus={e => { e.target.style.border = '2.5px solid #16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.1)'; }}
                onBlur={e => { if (!form.password) { e.target.style.border = '2px solid #e2e8f0'; e.target.style.boxShadow = 'none'; } }}
              />
              <EyeIcon show={showPassword} toggle={() => setShowPassword(!showPassword)}/>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '14px', height: '14px', accentColor: '#16a34a' }}/> Remember me
            </label>
            <span
              onClick={() => router.push('/forgot-password')}
              style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', cursor: 'pointer' }}>
              Forgot Password?
            </span>
          </div>

          {/* Sign In */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: loading ? '#86efac' : '#16a34a',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '14px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
            transition: 'all 0.2s',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
            </svg>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Divider */}
          <div style={{ textAlign: 'center', position: 'relative', marginBottom: '14px' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e2e8f0' }}/>
            <span style={{ background: 'white', padding: '0 12px', fontSize: '12px', color: '#94a3b8', position: 'relative' }}>or</span>
          </div>

          {/* Back Button */}
          <button type="button" onClick={() => router.push('/')} style={{
            width: '100%', padding: '12px', background: 'white',
            color: '#374151', border: '2px solid #e2e8f0', borderRadius: '12px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#374151">
              <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5z" transform="rotate(180 12 12)"/>
            </svg>
            Back to Login Type Selection
          </button>
        </form>

        {/* Admin illustration */}
        <div style={{ marginTop: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <svg viewBox="0 0 200 80" width="200" height="80">
            <rect x="20" y="50" width="160" height="4" rx="2" fill="#e2e8f0"/>
            <rect x="55" y="18" width="90" height="36" rx="4" fill="#dcfce7"/>
            <rect x="62" y="25" width="40" height="5" rx="2" fill="#86efac"/>
            <rect x="62" y="34" width="30" height="4" rx="2" fill="#bbf7d0"/>
            <rect x="110" y="25" width="28" height="22" rx="3" fill="#16a34a" opacity="0.3"/>
            <rect x="113" y="28" width="22" height="3" rx="1" fill="#16a34a"/>
            <rect x="113" y="33" width="16" height="3" rx="1" fill="#16a34a" opacity="0.7"/>
            <rect x="113" y="38" width="20" height="3" rx="1" fill="#16a34a" opacity="0.7"/>
            <circle cx="100" cy="12" r="8" fill="#16a34a"/>
            <path d="M97 12l2 2 4-4" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="38" cy="46" r="4" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/>
            <circle cx="162" cy="46" r="4" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>
    </div>
  );
}