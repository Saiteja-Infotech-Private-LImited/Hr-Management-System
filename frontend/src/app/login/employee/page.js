'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/store/authSlice';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

/* ============================================================
   EYE ICON
============================================================ */

const EyeIcon = ({ show, toggle }) => (
  <button
    type="button"
    onClick={toggle}
    className="absolute right-4 top-1/2 -translate-y-1/2
      text-slate-400 hover:text-slate-600
      dark:hover:text-slate-200 transition-colors"
  >
    {show ? (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ) : (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    )}
  </button>
);

/* ============================================================
   OTP BOX
============================================================ */

const OtpBox = ({
  value,
  index,
  onChange,
  onKeyDown,
  onPaste,
  inputRef,
  disabled,
}) => {
  const hasValue = value !== '';

  return (
    <div className="relative">
      {hasValue && (
        <div
          className="absolute inset-0 rounded-2xl
          bg-emerald-400/10 dark:bg-[#ccf000]/10
          blur-md"
        />
      )}

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete={index === 0 ? 'one-time-code' : 'off'}
        maxLength={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e, index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        onPaste={index === 0 ? onPaste : undefined}
        aria-label={`OTP digit ${index + 1}`}
        className={`
          relative z-10
          w-full aspect-square
          rounded-2xl
          border-2
          bg-white dark:bg-[#0f172a]
          text-center
          text-xl sm:text-2xl
          font-bold
          text-slate-900 dark:text-white
          outline-none
          transition-all duration-200

          ${hasValue
            ? 'border-[#10b981] dark:border-[#ccf000] shadow-lg shadow-emerald-500/10'
            : 'border-slate-200 dark:border-slate-700'
          }

          focus:border-[#10b981]
          dark:focus:border-[#ccf000]

          focus:ring-4
          focus:ring-emerald-500/10
          dark:focus:ring-[#ccf000]/10

          disabled:opacity-60
          disabled:cursor-not-allowed
        `}
      />
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function EmployeeLogin() {
  const router = useRouter();
  const dispatch = useDispatch();

  /* ==========================================================
     LOGIN FORM
  ========================================================== */

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  /* ==========================================================
     OTP
  ========================================================== */

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpEmail, setOtpEmail] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  const otpRefs = useRef([]);

  /* ==========================================================
     UI
  ========================================================== */

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');

  /* ==========================================================
     5 SECOND VERIFICATION SCREEN
  ========================================================== */

  const [verificationStage, setVerificationStage] =
    useState('idle');

  /*
    idle
    verifying
    success
  */

  /* ==========================================================
     RESEND TIMER
  ========================================================== */

  useEffect(() => {
    if (!showOtpScreen) return;

    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showOtpScreen, resendTimer]);

  /* ==========================================================
     FORM CHANGE
  ========================================================== */

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError('');
  };

  /* ==========================================================
     OTP VALUE
  ========================================================== */

  const otpValue = otp.join('');

  /* ==========================================================
     OTP CHANGE
  ========================================================== */

  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, '');

    if (!value) {
      const updated = [...otp];
      updated[index] = '';
      setOtp(updated);
      setOtpError('');
      return;
    }

    const updated = [...otp];
    updated[index] = value.charAt(value.length - 1);

    setOtp(updated);
    setOtpError('');

    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  /* ==========================================================
     OTP KEYBOARD
  ========================================================== */

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const updated = [...otp];
        updated[index] = '';
        setOtp(updated);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();

        const updated = [...otp];
        updated[index - 1] = '';
        setOtp(updated);
      }

      setOtpError('');
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  /* ==========================================================
     OTP PASTE
  ========================================================== */

  const handleOtpPaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pasted) return;

    const updated = ['', '', '', '', '', ''];

    pasted.split('').forEach((digit, index) => {
      updated[index] = digit;
    });

    setOtp(updated);
    setOtpError('');

    const focusIndex = Math.min(
      pasted.length,
      5
    );

    otpRefs.current[focusIndex]?.focus();
  };

  /* ==========================================================
     STEP 1 - LOGIN
  ========================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const res = await api.post(
        '/api/auth/login',
        {
          email: form.email.trim(),
          password: form.password,
          loginType: 'EMPLOYEE',
        }
      );

      const data = res.data?.data;

      /* ======================================================
         OTP REQUIRED
      ====================================================== */

      if (data?.requiresOtp) {
        setOtpEmail(
          data.email || form.email.trim()
        );

        setShowOtpScreen(true);

        setOtp([
          '',
          '',
          '',
          '',
          '',
          '',
        ]);

        setOtpError('');

        setVerificationStage('idle');

        setResendTimer(60);

        toast.success(
          'OTP sent to your registered email',
          {
            style: {
              background: '#111827',
              color: '#fff',
              borderRadius: '12px',
            },
          }
        );

        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 150);

        return;
      }

      /* ======================================================
         FALLBACK JWT LOGIN
      ====================================================== */

      if (data?.accessToken) {
        completeLogin(data);
      } else {
        setError(
          'Unexpected response from the server.'
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     STEP 2 - VERIFY OTP
  ========================================================== */

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otpValue.length !== 6) {
      setOtpError(
        'Please enter the complete 6-digit OTP.'
      );
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setVerificationStage('verifying');

    try {
      const res = await api.post(
        '/api/auth/verify-login-otp',
        {
          email: otpEmail,
          otp: otpValue,
        }
      );

      const data = res.data?.data;

      /* ======================================================
         IMPORTANT

         API SUCCESS RECEIVED.
         NOW SHOW 5 SECOND PREMIUM VERIFICATION.
      ====================================================== */

      if (!data?.accessToken) {
        setVerificationStage('idle');
        setOtpError(
          'Login response is missing the access token.'
        );
        setOtpLoading(false);
        return;
      }

      /*
        Keep verifying screen visible for 5 seconds.
      */

      setTimeout(() => {
        setVerificationStage('success');

        setTimeout(() => {
          completeLogin(data);
        }, 700);
      }, 5000);
    } catch (err) {
      /*
        IMPORTANT:
        Wrong OTP should NEVER display
        "Invalid email or password".
      */

      setVerificationStage('idle');

      setOtpError(
        err.response?.data?.message ||
        'Invalid OTP. Please check the code and try again.'
      );

      setOtpLoading(false);
    }
  };

  /* ==========================================================
     RESEND OTP
  ========================================================== */

  const handleResendOtp = async () => {
    if (
      resendTimer > 0 ||
      resendLoading ||
      otpLoading ||
      !otpEmail
    ) {
      return;
    }

    setResendLoading(true);
    setOtpError('');

    try {
      const res = await api.post(
        '/api/auth/resend-login-otp',
        {
          email: otpEmail,
        }
      );

      const data = res.data?.data;

      if (data?.otpSent) {
        setOtp([
          '',
          '',
          '',
          '',
          '',
          '',
        ]);

        setResendTimer(60);

        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);

        toast.success(
          'A new OTP has been sent to your email.',
          {
            style: {
              background: '#111827',
              color: '#fff',
              borderRadius: '12px',
            },
          }
        );
      } else {
        setOtpError(
          res.data?.message ||
          'Unable to resend OTP.'
        );
      }
    } catch (err) {
      setOtpError(
        err.response?.data?.message ||
        'Unable to resend OTP. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  /* ==========================================================
     COMPLETE LOGIN
  ========================================================== */

  const completeLogin = (data) => {
    dispatch(
      loginSuccess({
        token: data.accessToken,
        user: data,
      })
    );

    toast.success(
      'Welcome ' +
      (data.name || 'Employee') +
      '!',
      {
        style: {
          background: '#111827',
          color: '#fff',
          borderRadius: '12px',
        },
      }
    );

    router.push('/employee/dashboard');
  };

  /* ==========================================================
     BACK TO LOGIN
  ========================================================== */

  const handleBackToLogin = () => {
    if (otpLoading) return;

    setShowOtpScreen(false);

    setOtp([
      '',
      '',
      '',
      '',
      '',
      '',
    ]);

    setOtpEmail('');
    setOtpError('');
    setError('');
    setResendTimer(60);
    setVerificationStage('idle');
  };

  const isFormFilled =
    form.email.trim() &&
    form.password;

  /* ==========================================================
     VERIFICATION SCREEN
  ========================================================== */

  if (
    showOtpScreen &&
    verificationStage === 'verifying'
  ) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-[#050816] flex items-center justify-center px-6 transition-colors duration-500">

        <div className="relative w-full max-w-md">

          {/* BACKGROUND GLOW */}

          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-400/10 dark:bg-[#ccf000]/5 blur-3xl" />

          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-400/10 dark:bg-emerald-500/5 blur-3xl" />

          {/* MAIN VERIFICATION CARD */}

          <div className="relative rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-2xl p-10 text-center overflow-hidden">

            {/* TOP LINE */}

            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-[#10b981] to-[#ccf000]" />

            {/* ANIMATED ICON */}

            <div className="relative flex justify-center mb-8">

              <div className="absolute w-28 h-28 rounded-full border border-emerald-400/20 dark:border-[#ccf000]/20 animate-ping" />

              <div className="absolute w-24 h-24 rounded-full border border-emerald-400/20 dark:border-[#ccf000]/20" />

              <div className="relative w-20 h-20 rounded-full bg-emerald-50 dark:bg-[#ccf000]/10 border border-emerald-200 dark:border-[#ccf000]/20 flex items-center justify-center">

                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#10b981] dark:text-[#ccf000] animate-pulse"
                >
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="m4.93 4.93 2.83 2.83" />
                  <path d="m16.24 16.24 2.83 2.83" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                  <path d="m4.93 19.07 2.83-2.83" />
                  <path d="m16.24 7.76 2.83-2.83" />
                </svg>

              </div>

            </div>

            <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#10b981] dark:text-[#ccf000] mb-3">
              Secure Login
            </p>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Verifying your identity
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              Please wait while we securely verify your OTP.
            </p>

            {/* EMAIL */}

            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/70">

              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#ccf000] animate-pulse" />

              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {otpEmail}
              </span>

            </div>

            {/* PROGRESS */}

            <div className="mt-8">

              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">

                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-[#10b981] to-[#ccf000]"
                  style={{
                    width: '100%',
                    animation:
                      'otpProgress 5s linear forwards',
                  }}
                />

              </div>

            </div>

            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400">

              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  className="opacity-25"
                />

                <path d="M12 3a9 9 0 0 1 9 9" />
              </svg>

              Authenticating securely...

            </div>

          </div>

          <style jsx>{`
            @keyframes otpProgress {
              from {
                width: 0%;
              }

              to {
                width: 100%;
              }
            }
          `}</style>

        </div>

      </div>
    );
  }

  /* ==========================================================
     SUCCESS SCREEN
  ========================================================== */

  if (
    showOtpScreen &&
    verificationStage === 'success'
  ) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-[#050816] flex items-center justify-center px-6">

        <div className="text-center">

          <div className="mx-auto w-24 h-24 rounded-full bg-emerald-50 dark:bg-[#ccf000]/10 border border-emerald-200 dark:border-[#ccf000]/20 flex items-center justify-center">

            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#10b981] dark:text-[#ccf000]"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>

          </div>

          <h2 className="mt-7 text-2xl font-bold text-slate-900 dark:text-white">
            Verification successful
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Taking you to your employee dashboard...
          </p>

        </div>

      </div>
    );
  }

  /* ==========================================================
     MAIN LOGIN UI
  ========================================================== */

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-[#0B1120] transition-colors duration-500">

      {/* ======================================================
          LEFT PANEL
      ====================================================== */}

      <div className="hidden lg:flex lg:w-[45%] flex-col bg-slate-900 dark:bg-black relative">

        <div className="flex-1 relative overflow-hidden">

          <img
            src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80"
            alt="Team Working"
            className="absolute inset-0 w-full h-full object-cover opacity-90 dark:opacity-40"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#10b981] dark:bg-[#ccf000]" />

        </div>

        <div className="h-auto p-12 lg:px-16 lg:py-14 flex flex-col justify-center bg-[#111827] dark:bg-[#0B1120] border-t dark:border-slate-800">

          <div className="flex items-center gap-3 mb-6">

            <div className="w-8 h-8 rounded border-2 border-[#10b981] dark:border-[#ccf000] flex items-center justify-center">

              <span className="text-[#10b981] dark:text-[#ccf000] font-bold text-lg">
                H
              </span>

            </div>

            <span className="text-white font-bold text-[17px] tracking-tight">
              Saiteja Infotech Private Limited - Employee
            </span>

          </div>

          <h1 className="text-white text-4xl xl:text-5xl font-bold leading-[1.1] mb-4 tracking-tight">

            Let's empower your
            <br />

            <span className="dark:text-[#ccf000] text-[#10b981]">
              employees
            </span>{' '}
            today.

          </h1>

          <p className="text-slate-400 text-[13px] font-medium max-w-sm">
            We help to complete all your conveyancing needs easily
          </p>

        </div>

      </div>

      {/* ======================================================
          RIGHT PANEL
      ====================================================== */}

      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center relative p-8">

        {/* BACK */}

        <button
          onClick={() =>
            showOtpScreen
              ? handleBackToLogin()
              : router.push('/')
          }
          className="absolute top-8 left-8 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2 text-sm font-medium transition-colors"
        >

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>

          {showOtpScreen
            ? 'Back to Login'
            : 'Back'}

        </button>

        <div className="w-full max-w-sm xl:max-w-md flex flex-col pt-12">

          {/* ==================================================
              LOGIN
          ================================================== */}

          {!showOtpScreen ? (

            <>

              <h2 className="text-[22px] font-bold text-slate-900 dark:text-white mb-8 text-center">

                Login first to{' '}

                <span className="dark:text-[#ccf000] text-[#10b981]">
                  your account
                </span>

              </h2>

              {error && (

                <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-3 mb-6 flex items-center gap-3">

                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>

                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {error}
                  </span>

                </div>

              )}

              <form
                onSubmit={handleSubmit}
                className="w-full flex flex-col gap-5"
              >

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="emp-email"
                    className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Email Address{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="emp-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Input your registered email"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-1 focus:ring-[#10b981] dark:focus:ring-[#ccf000] transition-all text-slate-800 dark:text-white placeholder-slate-400"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <label
                    htmlFor="emp-password"
                    className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Password{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">

                    <input
                      id="emp-password"
                      name="password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Input your password account"
                      required
                      autoComplete="current-password"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] text-[13px] focus:outline-none focus:border-[#10b981] dark:focus:border-[#ccf000] focus:ring-1 focus:ring-[#10b981] dark:focus:ring-[#ccf000] transition-all text-slate-800 dark:text-white placeholder-slate-400"
                    />

                    <EyeIcon
                      show={showPassword}
                      toggle={() =>
                        setShowPassword(!showPassword)
                      }
                    />

                  </div>

                </div>

                {/* REMEMBER */}

                <div className="flex items-center justify-between mt-1 mb-2">

                  <label className="flex items-center gap-2 cursor-pointer">

                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-[#10b981] dark:text-[#ccf000]"
                    />

                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Remember Me
                    </span>

                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      router.push('/forgot-password')
                    }
                    className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-[#10b981] dark:hover:text-[#ccf000]"
                  >
                    Forgot Password
                  </button>

                </div>

                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !isFormFilled
                  }
                  className={`
                    w-full py-3 rounded-lg
                    text-[13px] font-bold
                    transition-all
                    flex items-center justify-center gap-2

                    ${isFormFilled
                      ? 'bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300]'
                      : 'bg-[#f1f5f9] dark:bg-[#1E293B] text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }
                  `}
                >

                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>

                      Sending OTP...
                    </>
                  ) : (
                    'Login'
                  )}

                </button>

              </form>

            </>

          ) : (

            /* ==================================================
               PREMIUM OTP SCREEN
            ================================================== */

            <div className="relative">

              {/* HEADER */}

              <div className="text-center mb-8">

                <div className="mx-auto mb-6 relative w-20 h-20">

                  <div className="absolute inset-0 rounded-full bg-emerald-400/10 dark:bg-[#ccf000]/10 blur-xl" />

                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-50 to-white dark:from-[#ccf000]/10 dark:to-[#111827] border border-emerald-200 dark:border-[#ccf000]/20 flex items-center justify-center">

                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#10b981] dark:text-[#ccf000]"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      />

                      <path d="M3 7l9 6 9-6" />

                      <path d="M16 15l1.5 1.5L20 14" />
                    </svg>

                  </div>

                </div>

                <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#10b981] dark:text-[#ccf000] mb-2">
                  Identity Verification
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Enter your code
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                  We sent a 6-digit verification code to
                </p>

                <div className="mt-3 flex justify-center">

                  <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {otpEmail}
                  </span>

                </div>

              </div>

              {/* ERROR */}

              {otpError && (

                <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">

                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-red-500"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>

                    </div>

                    <div>

                      <p className="text-xs font-bold text-red-600 dark:text-red-400">
                        Verification failed
                      </p>

                      <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5">
                        {otpError}
                      </p>

                    </div>

                  </div>

                </div>

              )}

              {/* OTP FORM */}

              <form
                onSubmit={handleVerifyOtp}
                className="w-full"
              >

                <div className="flex items-center justify-between mb-3">

                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Verification Code
                  </span>

                  <span className="text-[10px] font-bold tracking-widest text-slate-400">
                    6 DIGITS
                  </span>

                </div>

                {/* OTP BOXES */}

                <div className="grid grid-cols-6 gap-2.5 sm:gap-3">

                  {otp.map((digit, index) => (

                    <OtpBox
                      key={index}
                      value={digit}
                      index={index}
                      inputRef={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      onChange={handleOtpChange}
                      onKeyDown={handleOtpKeyDown}
                      onPaste={handleOtpPaste}
                      disabled={otpLoading}
                    />

                  ))}

                </div>

                {/* TIMER */}

                <div className="flex items-center justify-between mt-5 mb-7">

                  <div className="flex items-center gap-2">

                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">

                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-500"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                        />

                        <polyline points="12 7 12 12 15 14" />
                      </svg>

                    </div>

                    <span className="text-[10px] text-slate-500 dark:text-slate-400">

                      {resendTimer > 0
                        ? `Resend available in ${resendTimer}s`
                        : 'Didn’t receive the code?'}

                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={
                      resendTimer > 0 ||
                      resendLoading ||
                      otpLoading
                    }
                    className={`
                      text-[11px]
                      font-bold
                      transition-all

                      ${resendTimer > 0 ||
                        resendLoading
                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                        : 'text-[#10b981] dark:text-[#ccf000] hover:underline'
                      }
                    `}
                  >

                    {resendLoading
                      ? 'Sending...'
                      : 'Resend OTP'}

                  </button>

                </div>

                {/* VERIFY */}

                <button
                  type="submit"
                  disabled={
                    otpLoading ||
                    otpValue.length !== 6
                  }
                  className={`
                    relative
                    overflow-hidden
                    w-full
                    h-13
                    rounded-2xl
                    text-[13px]
                    font-bold
                    transition-all
                    flex
                    items-center
                    justify-center
                    gap-2

                    ${otpValue.length === 6
                      ? 'bg-[#10b981] dark:bg-[#ccf000] text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-[#bce300] shadow-xl shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }
                  `}
                >

                  {otpLoading ? (

                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />

                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>

                      Verifying...

                    </>

                  ) : (

                    <>
                      Verify & Continue

                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>

                    </>

                  )}

                </button>

                {/* SECURITY */}

                <div className="flex items-center justify-center gap-2 mt-6">

                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-emerald-500 dark:text-[#ccf000]"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="10"
                      rx="2"
                    />

                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Your OTP is valid for 10 minutes
                  </span>

                </div>

              </form>

              {/* DIFFERENT ACCOUNT */}

              <button
                type="button"
                onClick={handleBackToLogin}
                disabled={
                  otpLoading ||
                  resendLoading
                }
                className="w-full mt-7 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#10b981] dark:hover:text-[#ccf000] transition-colors"
              >
                ← Use a different account
              </button>

            </div>
          )}

        </div>

        {/* FOOTER */}

        <div className="absolute bottom-6 left-0 w-full px-6 xl:px-12 flex flex-col xl:flex-row justify-between items-center gap-4 text-[10px] text-slate-400">

          <div className="flex flex-col text-center xl:text-left">

            <span className="font-semibold text-slate-500 uppercase tracking-wider">
              © 2025 Saiteja Infotech Private Limited.
            </span>

            <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
              All rights reserved.
            </span>

          </div>

          <div className="flex gap-6 items-center">

            <Link
              href="/terms"
              className="hover:text-slate-600 font-bold uppercase tracking-wider"
            >
              Terms & Conditions
            </Link>

            <Link
              href="/privacy"
              className="hover:text-slate-600 font-bold uppercase tracking-wider"
            >
              Privacy Policy
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}