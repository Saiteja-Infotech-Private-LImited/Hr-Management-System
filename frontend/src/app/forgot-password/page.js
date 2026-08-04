'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

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
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
);

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#1e293b',
    background: 'white',
    transition: 'border 0.2s',
  };



  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      toast.success('OTP resent to your email!');
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        email,
        otp,
        newPassword,
      });
      toast.success('Password reset successfully!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const met6chars = newPassword.length >= 6;
  const metMatch = newPassword === confirmPassword && confirmPassword !== '';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #dbeafe 0%, #eff6ff 45%, #ffffff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: '28px',
        padding: '40px 36px', width: '100%', maxWidth: '420px',
        boxShadow: '0 8px 40px rgba(59,130,246,0.12)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Lock Icon */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          {[1, 2, 3].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: step >= s ? '#1e3a5f' : '#e2e8f0',
                color: step >= s ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700', transition: 'all 0.3s',
              }}>
                {step > s ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s}
              </div>
              {i < 2 && (
                <div style={{
                  width: '40px', height: '2px',
                  background: step > s ? '#1e3a5f' : '#e2e8f0',
                  transition: 'all 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '28px' }}>
          {['Enter Email', 'Reset Password', 'Done!'].map((label, i) => (
            <span key={label} style={{
              fontSize: '11px',
              fontWeight: step === i + 1 ? '700' : '400',
              color: step === i + 1 ? '#1e3a5f' : '#94a3b8',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* ── STEP 1 — Enter Email ── */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
              Forgot Password?
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '28px', textAlign: 'center', lineHeight: 1.6 }}>
              Enter your registered email and we&apos;ll send you an OTP to reset your password
            </p>

            <form onSubmit={handleSendOtp} style={{ width: '100%' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    style={{ ...inputStyle, paddingLeft: '38px' }}
                    onFocus={e => e.target.style.borderColor = '#1e3a5f'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  background: '#1e3a5f', color: 'white',
                  border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginBottom: '12px',
                }}>
                {loading ? '⏳ Sending OTP...' : '→ Send OTP to Email'}
              </button>

              <button type="button" onClick={() => router.back()}
                style={{
                  width: '100%', padding: '12px',
                  background: 'white', color: '#374151',
                  border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                }}>
                ← Back to Login
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2 — Enter OTP + New Password ── */}
        {step === 2 && (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
              Reset Password
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', textAlign: 'center' }}>
              OTP sent to
            </p>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a5f', marginBottom: '24px' }}>
              {email}
            </p>

            <form onSubmit={handleResetPassword} style={{ width: '100%' }}>

              {/* OTP Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  required
                  style={{
                    ...inputStyle,
                    textAlign: 'center',
                    fontSize: '28px',
                    fontWeight: '800',
                    letterSpacing: '12px',
                    color: '#1e3a5f',
                    padding: '14px',
                  }}
                  onFocus={e => e.target.style.borderColor = '#1e3a5f'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
                  Check your email inbox or spam folder · Valid for 10 minutes
                </div>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                  autoComplete="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    style={{ ...inputStyle, paddingRight: '44px' }}
                    onFocus={e => e.target.style.borderColor = '#1e3a5f'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <EyeIcon show={showNew} toggle={() => setShowNew(!showNew)} />
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    autoComplete="new-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    style={{ ...inputStyle, paddingRight: '44px' }}
                    onFocus={e => e.target.style.borderColor = '#1e3a5f'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <EyeIcon show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                </div>
              </div>

              {/* Password Rules */}
              <div style={{
                background: '#f8fafc', borderRadius: '10px',
                padding: '12px', marginBottom: '20px',
                border: '1px solid #e2e8f0',
              }}>
                {[
                  { rule: 'At least 6 characters', met: met6chars },
                  { rule: 'Passwords match', met: metMatch },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i === 0 ? '4px' : 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke={r.met ? '#16a34a' : '#cbd5e1'} strokeWidth="3"
                      strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: '12px', color: r.met ? '#16a34a' : '#94a3b8' }}>
                      {r.rule}
                    </span>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  background: '#1e3a5f', color: 'white',
                  border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginBottom: '12px',
                }}>
                {loading ? '⏳ Resetting...' : '🔒 Reset Password'}
              </button>

              <button type="button" onClick={() => setStep(1)}
                style={{
                  width: '100%', padding: '12px',
                  background: 'white', color: '#374151',
                  border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  marginBottom: '16px',
                }}>
                ← Back
              </button>
            </form>

            {/* Resend OTP */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Didn&apos;t receive OTP?{' '}
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: '12px', color: '#3b82f6', fontWeight: '700', cursor: 'pointer' }}>
                Resend OTP
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3 — Success ── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#dcfce7', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
              border: '3px solid #bbf7d0',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
              Password Reset! 🎉
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '32px', lineHeight: 1.6 }}>
              Your password has been reset successfully. You can now login with your new password.
            </p>

            <button onClick={() => router.push('/')}
              style={{
                width: '100%', padding: '13px',
                background: '#1e3a5f', color: 'white',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              }}>
              → Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}