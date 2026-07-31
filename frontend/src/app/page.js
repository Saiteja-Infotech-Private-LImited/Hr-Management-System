'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px',
        padding: '48px 40px', width: '100%', maxWidth: '440px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Header */}
        <div style={{
          width: '64px', height: '64px',
          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <span style={{ color: 'white', fontSize: '28px', fontWeight: '800' }}>H</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>HRMS</h1>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6', letterSpacing: '2px', marginBottom: '4px' }}>HR MANAGEMENT SYSTEM</p>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Streamline · Manage · Empower</p>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '32px' }}>Choose how you want to sign in</p>

        {/* Employee Card */}
        <Link
          href="/login/employee"
          style={{
            width: '100%', border: '2px solid #3b82f6',
            borderRadius: '14px', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
            marginBottom: '14px', cursor: 'pointer',
            background: '#eff6ff', transition: 'all 0.2s',
            textDecoration: 'none',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#dbeafe'}
          onMouseOut={e => e.currentTarget.style.background = '#eff6ff'}
        >
          <div style={{
            width: '48px', height: '48px', background: '#dbeafe',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '3px' }}>Employee Login</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Access your personal dashboard and services</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </Link>

        {/* Admin Card */}
        <Link
          href="/login/admin"
          style={{
            width: '100%', border: '2px solid #16a34a',
            borderRadius: '14px', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
            marginBottom: '32px', cursor: 'pointer',
            background: '#f0fdf4', transition: 'all 0.2s',
            textDecoration: 'none',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#dcfce7'}
          onMouseOut={e => e.currentTarget.style.background = '#f0fdf4'}
        >
          <div style={{
            width: '48px', height: '48px', background: '#dcfce7',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#16a34a">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '3px' }}>HR / Admin Login</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Access admin panel and manage the system</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#16a34a"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </Link>

        {/* Illustration */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'flex-end' }}>
          <svg viewBox="0 0 80 80" width="80" height="80">
            <rect x="10" y="30" width="60" height="40" rx="4" fill="#dbeafe"/>
            <rect x="20" y="40" width="40" height="4" rx="2" fill="#93c5fd"/>
            <rect x="20" y="48" width="30" height="4" rx="2" fill="#bfdbfe"/>
            <rect x="20" y="56" width="35" height="4" rx="2" fill="#bfdbfe"/>
            <circle cx="40" cy="18" r="10" fill="#3b82f6"/>
            <path d="M36 18l3 3 5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
          <svg viewBox="0 0 80 80" width="80" height="80">
            <rect x="10" y="30" width="60" height="40" rx="4" fill="#dcfce7"/>
            <rect x="20" y="40" width="40" height="4" rx="2" fill="#86efac"/>
            <rect x="20" y="48" width="30" height="4" rx="2" fill="#bbf7d0"/>
            <rect x="20" y="56" width="35" height="4" rx="2" fill="#bbf7d0"/>
            <circle cx="40" cy="18" r="10" fill="#16a34a"/>
            <path d="M36 18l3 3 5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </div>

        <p style={{ fontSize: '11px', color: '#cbd5e1' }}>© 2025 HRMS. All rights reserved.</p>
      </div>
    </div>
  );
}