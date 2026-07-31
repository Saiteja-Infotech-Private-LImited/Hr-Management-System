'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0f1523] to-[#090b14]">
      <div className="w-full max-w-md bg-[#1e2333] p-10 rounded-[32px] shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-b from-[#6b8fff] to-[#5174ff] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(81,116,255,0.3)]">
          <span className="text-white text-3xl font-black">H</span>
        </div>
        <h1 className="text-[26px] font-extrabold text-white mb-1 tracking-tight">HRMS</h1>
        <p className="text-[10px] font-bold text-[#5174ff] uppercase tracking-[0.2em] mb-3">Management System</p>
        <p className="text-[13px] text-slate-300 mb-10 font-medium">Streamline · Manage · Empower</p>
        
        <p className="text-[11px] font-bold text-slate-400 mb-4 w-full text-left uppercase tracking-wider">Select Portal</p>

        {/* Employee Card */}
        <Link
          href="/login/employee"
          className="group w-full flex items-center gap-4 p-5 mb-4 rounded-xl bg-[#343a4a] hover:bg-[#3d4456] transition-colors cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-[#273961] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#5174ff] stroke-[2] stroke-linecap-round stroke-linejoin-round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="text-[15px] font-bold text-white mb-1">Employee Portal</div>
            <div className="text-[12px] font-medium text-slate-400">Access your personal dashboard</div>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#464d60] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-300 stroke-[2.5] stroke-linecap-round stroke-linejoin-round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </Link>

        {/* Admin Card */}
        <Link
          href="/login/admin"
          className="group w-full flex items-center gap-4 p-5 mb-8 rounded-xl bg-[#343a4a] hover:bg-[#3d4456] transition-colors cursor-pointer"
        >
          <div className="w-11 h-11 rounded-full bg-[#1b433a] flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#10b981] stroke-[2] stroke-linecap-round stroke-linejoin-round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="text-[15px] font-bold text-white mb-1">HR / Admin Portal</div>
            <div className="text-[12px] font-medium text-slate-400">Manage system and personnel</div>
          </div>
          <div className="w-6 h-6 rounded-full bg-[#464d60] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-300 stroke-[2.5] stroke-linecap-round stroke-linejoin-round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </Link>

        <p className="text-[10px] font-semibold text-[#5a6275] uppercase tracking-wider">© 2025 HRMS. All rights reserved.</p>
      </div>
    </div>
  );
}