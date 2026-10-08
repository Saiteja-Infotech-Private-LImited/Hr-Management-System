'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  getMyAttendance,
  checkIn,
  checkOut,
  getMyLeaves,
  getLeaveBalance,
  getUnreadCount,
  getMyNotifications,
} from '@/lib/employeeApi';
import toast from 'react-hot-toast';

import {
  CalendarDays,
  Clock3,
  Bell,
  CheckCircle2,
  LogIn,
  LogOut,
  ArrowRight,
  Palmtree,
  Thermometer,
  Sun,
  Baby,
  ClipboardList,
  BriefcaseBusiness,
  FileText,
  UserRound,
  Sparkles,
  ChevronRight,
  Timer,
  TrendingUp,
} from 'lucide-react';

/* =========================================================
   CSS  (all dashboard layout lives here – no !important wars)
   ========================================================= */

const dashboardCSS = `
@keyframes employeeDashboardSpin { to { transform: rotate(360deg); } }

.ed-root { width: 100%; max-width: 100%; min-width: 0; color: var(--text-primary); }
.ed-root *, .ed-root *::before, .ed-root *::after { box-sizing: border-box; }

/* ---------- cards ---------- */
.ed-card {
  position: relative; overflow: hidden; min-width: 0;
  padding: 22px; background: var(--card-bg);
  border: 1px solid var(--card-border); border-radius: 18px;
  box-shadow: var(--card-shadow);
}
.ed-mb { margin-bottom: 18px; }

/* ---------- header ---------- */
.ed-header {
  background: linear-gradient(135deg, var(--card-bg), rgba(59,130,246,0.035));
  padding: 24px;
}
.ed-header-glow {
  position: absolute; width: 260px; height: 260px; border-radius: 50%;
  right: -110px; top: -130px; pointer-events: none;
  background: radial-gradient(circle, rgba(59,130,246,.15), transparent 68%);
}
.ed-header-row {
  position: relative; z-index: 1; display: flex; align-items: center;
  justify-content: space-between; gap: 20px;
}
.ed-user { display: flex; align-items: center; gap: 15px; min-width: 0; }
.ed-avatar {
  width: 56px; height: 56px; border-radius: 17px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff; font-weight: 900; font-size: 17px;
  box-shadow: 0 8px 22px rgba(59,130,246,.22);
}
.ed-greeting { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-bottom: 5px; }
.ed-greeting span { font-size: 22px; font-weight: 800; line-height: 1.25; }
.ed-sub { font-size: 12px; color: var(--text-secondary); }
.ed-date {
  display: flex; align-items: center; gap: 7px; font-size: 12px;
  color: var(--text-secondary); white-space: nowrap;
}

/* ---------- grids ---------- */
.ed-kpis    { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 15px; margin-bottom: 18px; }
.ed-two     { display: grid; grid-template-columns: minmax(0,1.1fr) minmax(0,.9fr); gap: 18px; margin-bottom: 18px; }
.ed-actions { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 10px; }
.ed-bottom  { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 18px; }
.ed-leaves  { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }

/* ---------- KPI ---------- */
.ed-kpi { padding: 20px; min-height: 132px; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.ed-kpi.clickable { cursor: pointer; }
.ed-kpi.clickable:hover { transform: translateY(-3px); box-shadow: 0 14px 35px rgba(15,23,42,.09); border-color: rgba(59,130,246,.25); }
.ed-kpi-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 16px; }
.ed-kpi-title { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
.ed-kpi-icon { width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.ed-kpi-value { font-size: 27px; line-height: 1; font-weight: 800; margin-bottom: 7px; }
.ed-kpi-sub { font-size: 11px; color: var(--text-secondary); }
.ed-kpi-blob { position: absolute; width: 120px; height: 120px; right: -55px; top: -55px; border-radius: 50%; opacity: .07; pointer-events: none; }

/* ---------- section header ---------- */
.ed-sh { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.ed-sh-left { display: flex; align-items: center; gap: 11px; min-width: 0; }
.ed-sh-icon { width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(59,130,246,.10); color: #3b82f6; }
.ed-sh-title { font-size: 14px; font-weight: 800; }
.ed-sh-sub { font-size: 11px; margin-top: 3px; color: var(--text-secondary); }
.ed-sh-action { border: none; background: transparent; color: #3b82f6; display: flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 700; cursor: pointer; padding: 6px; white-space: nowrap; }

/* ---------- attendance ---------- */
.ed-att-glow { position: absolute; right: -60px; top: -80px; width: 190px; height: 190px; border-radius: 50%; pointer-events: none; background: radial-gradient(circle, rgba(16,185,129,.11), transparent 68%); }
.ed-time { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 18px; padding: 18px; border-radius: 15px; background: var(--bg-primary); border: 1px solid var(--card-border); margin-bottom: 18px; position: relative; }
.ed-time-col { text-align: center; }
.ed-time-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: .4px; }
.ed-time-value { font-size: 28px; font-weight: 900; }
.ed-time-hint { font-size: 10px; color: var(--text-secondary); margin-top: 5px; }
.ed-time-divider { width: 1px; height: 55px; background: var(--card-border); }
.ed-status-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; position: relative; }
.ed-status-left { display: flex; align-items: center; gap: 8px; }
.ed-dot { width: 8px; height: 8px; border-radius: 50%; }
.ed-status-text { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
.ed-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; position: relative; }
.ed-btn { border: none; border-radius: 12px; padding: 13px; min-height: 46px; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 7px; }

/* ---------- leave balance ---------- */
.ed-lb { padding: 13px; border-radius: 14px; border: 1px solid var(--card-border); display: flex; align-items: center; gap: 11px; min-width: 0; }
.ed-lb-body { min-width: 0; }
.ed-lb-type { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .4px; }
.ed-lb-value { margin-top: 4px; font-size: 17px; font-weight: 900; white-space: nowrap; }
.ed-lb-value small { font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-left: 3px; }

/* ---------- quick actions ---------- */
.ed-qa {
  width: 100%; min-width: 0; display: flex; align-items: center; gap: 10px;
  padding: 14px 12px; min-height: 48px; border-radius: 13px; cursor: pointer; text-align: left;
  border: 1px solid var(--card-border); background: var(--bg-primary); color: var(--text-primary);
  font-size: 13px; font-weight: 700; transition: transform .2s ease, background .2s ease, border-color .2s ease;
}
.ed-qa span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ed-qa:hover { transform: translateY(-2px); border-color: rgba(59,130,246,.3); background: rgba(59,130,246,.05); }

/* ---------- list rows ---------- */
.ed-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--card-border); }
.ed-row:last-child { border-bottom: none; }
.ed-row-left { display: flex; align-items: center; gap: 11px; min-width: 0; flex: 1; }
.ed-row-icon { width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.ed-row-main { min-width: 0; flex: 1; }
.ed-row-title { font-size: 13px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ed-row-sub { font-size: 11px; color: var(--text-secondary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ed-row-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.ed-row-days { font-size: 11px; font-weight: 700; color: var(--text-secondary); white-space: nowrap; }
.ed-unread { width: 7px; height: 7px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }
.ed-footer { margin-top: 18px; display: flex; justify-content: center; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 11px; text-align: center; }

/* =========================================================
   TABLET  (<= 1100px)
   ========================================================= */
@media (max-width: 1100px) {
  .ed-kpis    { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .ed-actions { grid-template-columns: repeat(2, minmax(0,1fr)); }
}

/* =========================================================
   LARGE PHONE / SMALL TABLET  (<= 900px) – stack sections
   ========================================================= */
@media (max-width: 900px) {
  .ed-two, .ed-bottom { grid-template-columns: minmax(0,1fr); }
}

/* =========================================================
   PHONE  (<= 600px)
   ========================================================= */
@media (max-width: 600px) {
  .ed-card { padding: 16px; border-radius: 16px; }
  .ed-mb, .ed-kpis, .ed-two { margin-bottom: 12px; }
  .ed-kpis, .ed-two, .ed-bottom { gap: 12px; }

  /* header: stack, date below */
  .ed-header { padding: 16px; }
  .ed-header-row { flex-direction: column; align-items: flex-start; gap: 12px; }
  .ed-avatar { width: 48px; height: 48px; border-radius: 14px; font-size: 15px; }
  .ed-user { gap: 12px; width: 100%; }
  .ed-greeting span { font-size: 18px; }
  .ed-date {
    width: 100%; padding: 8px 12px; border-radius: 10px;
    background: var(--bg-primary); border: 1px solid var(--card-border);
    white-space: normal;
  }

  /* KPIs: 2 per row, tighter */
  .ed-kpis { gap: 10px; }
  .ed-kpi { padding: 14px; min-height: 118px; }
  .ed-kpi-top { margin-bottom: 12px; }
  .ed-kpi-title { font-size: 12px; }
  .ed-kpi-icon { width: 34px; height: 34px; }
  .ed-kpi-value { font-size: 24px; }

  .ed-sh { margin-bottom: 14px; }

  /* attendance */
  .ed-time { padding: 14px 10px; gap: 8px; }
  .ed-time-value { font-size: 24px; }
  .ed-time-divider { height: 44px; }

  /* quick actions: 2x2 */
  .ed-actions { gap: 8px; }
  .ed-qa { padding: 12px 10px; font-size: 12px; gap: 8px; }

  /* rows: let badge wrap under text if needed */
  .ed-row { align-items: flex-start; }
  .ed-row-left { align-items: center; }
  #ed-leave-rows .ed-row { flex-wrap: wrap; }
  #ed-leave-rows .ed-row-right { width: 100%; justify-content: space-between; padding-left: 49px; }
}

/* =========================================================
   SMALL PHONE  (<= 380px)
   ========================================================= */
@media (max-width: 380px) {

  .ed-leaves {
    grid-template-columns: minmax(0,1fr);
  }

  .ed-kpi-value {
    font-size: 22px;
  }

  .ed-time-value {
    font-size: 21px;
  }

  .ed-btn {
    font-size: 12px;
    padding: 12px 8px;
  }

}


/* =========================================================
   CHECKOUT CONFIRMATION MODAL
   ========================================================= */

.ed-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(4px);
}


.ed-modal {
  width: min(420px, 100%);

  padding: 24px;

  border-radius: 18px;

  background: var(--card-bg);

  border: 1px solid var(--card-border);

  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
}


.ed-modal-icon {
  width: 46px;
  height: 46px;

  margin-bottom: 14px;

  border-radius: 13px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(245, 158, 11, 0.12);

  color: #f59e0b;
}


.ed-modal-title {
  margin-bottom: 7px;

  font-size: 17px;

  font-weight: 800;

  color: var(--text-primary);
}


.ed-modal-text {
  margin-bottom: 22px;

  font-size: 13px;

  line-height: 1.55;

  color: var(--text-secondary);
}


.ed-modal-actions {
  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 10px;
}


.ed-modal-btn {
  min-height: 44px;

  padding: 11px 14px;

  border-radius: 11px;

  border: 1px solid var(--card-border);

  font-size: 13px;

  font-weight: 800;

  cursor: pointer;
}


.ed-modal-cancel {
  background: var(--bg-primary);

  color: var(--text-primary);
}


.ed-modal-confirm {
  border-color: #f59e0b;

  background: #f59e0b;

  color: #fff;
}


.ed-modal-btn:disabled {
  cursor: not-allowed;

  opacity: 0.7;
}


/* ---------- mobile modal ---------- */

@media (max-width: 600px) {

  .ed-modal {
    padding: 20px;
  }

  .ed-modal-actions {
    grid-template-columns: 1fr;
  }

}
`;

/* =========================================================
   LEAVE STYLES
   ========================================================= */

const leaveStyles = {
  ANNUAL: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.10)', icon: Palmtree },
  SICK: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.10)', icon: Thermometer },
  CASUAL: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.10)', icon: Sun },
  PATERNITY: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.10)', icon: Baby },
  MATERNITY: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.10)', icon: Baby },
  UNPAID: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.10)', icon: ClipboardList },
};

const statusStyles = {
  APPROVED: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.10)', border: 'rgba(16, 185, 129, 0.22)' },
  PENDING: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.22)' },
  REJECTED: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.22)' },
  CANCELLED: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.10)', border: 'rgba(100, 116, 139, 0.22)' },
  CANCELLATION_PENDING: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.10)', border: 'rgba(168, 85, 247, 0.22)' },
};

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function StatusBadge({ status }) {
  const s = statusStyles[status] || {
    color: 'var(--text-secondary)',
    bg: 'rgba(148, 163, 184, 0.10)',
    border: 'rgba(148, 163, 184, 0.20)',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 9px',
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: '1px solid ' + s.border,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.4px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {status ? status.replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
}

function KPI({ title, value, subtitle, icon: Icon, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      className={'ed-card ed-kpi' + (onClick ? ' clickable' : '')}
    >
      <div className="ed-kpi-blob" style={{ background: accent }} />

      <div className="ed-kpi-top">
        <span className="ed-kpi-title">{title}</span>
        <div
          className="ed-kpi-icon"
          style={{
            color: accent,
            background: accent + '12',
            border: '1px solid ' + accent + '25',
          }}
        >
          <Icon size={18} />
        </div>
      </div>

      <div className="ed-kpi-value">{value}</div>
      <div className="ed-kpi-sub">{subtitle}</div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action, onAction }) {
  return (
    <div className="ed-sh">
      <div className="ed-sh-left">
        <div className="ed-sh-icon">
          <Icon size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="ed-sh-title">{title}</div>
          {subtitle && <div className="ed-sh-sub">{subtitle}</div>}
        </div>
      </div>

      {action && (
        <button type="button" className="ed-sh-action" onClick={onAction}>
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function LeaveRing({ percentage, color }) {
  const size = 48;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, Number(percentage) || 0));
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={'0 0 ' + size + ' ' + size}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--card-border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 800,
        }}
      >
        {Math.round(safe)}%
      </div>
    </div>
  );
}

function DashboardLoader() {
  return (
    <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: '3px solid var(--card-border)',
            borderTopColor: '#3b82f6',
            animation: 'employeeDashboardSpin 0.8s linear infinite',
            margin: '0 auto 12px',
          }}
        />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Loading your dashboard...
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div
      style={{
        minHeight: 165,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'var(--text-secondary)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}
      >
        <Icon size={19} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, maxWidth: 240, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
   ========================================================= */

export default function EmployeeDashboard() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();

  const [attendance, setAttendance] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  /* ---------- fetch ---------- */

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const [attRes, leavesRes, balRes, notifRes, unreadRes] =
        await Promise.allSettled([
          getMyAttendance(0, 1000),
          getMyLeaves(0, 5),
          getLeaveBalance(),
          getMyNotifications(0, 5),
          getUnreadCount(),
        ]);

      if (attRes.status === 'fulfilled') {
        const records = attRes.value?.data?.data?.content || [];
        setAttendance(records);

        const n = new Date();
        const today =
          n.getFullYear() +
          '-' +
          String(n.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(n.getDate()).padStart(2, '0');

        setTodayAtt(records.find((r) => r.date === today) || null);
      } else {
        setAttendance([]);
        setTodayAtt(null);
      }

      setLeaves(
        leavesRes.status === 'fulfilled'
          ? leavesRes.value?.data?.data?.content || []
          : []
      );

      setBalance(
        balRes.status === 'fulfilled' ? balRes.value?.data?.data || [] : []
      );

      setNotifications(
        notifRes.status === 'fulfilled'
          ? notifRes.value?.data?.data?.content || []
          : []
      );

      setUnreadCount(
        unreadRes.status === 'fulfilled'
          ? Number(unreadRes.value?.data?.data || 0)
          : 0
      );
    } catch (error) {
      console.error('Employee dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ---------- check in / out ---------- */

  const handleCheckIn = async () => {
    if (todayAtt?.checkIn || checkingIn) return;
    setCheckingIn(true);
    try {
      await checkIn();
      toast.success('You are checked in successfully');
      await fetchAll();
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error?.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

const handleCheckOut = () => {
  if (!todayAtt?.checkIn || todayAtt?.checkOut || checkingOut) return;

  setShowCheckoutConfirm(true);
};

const confirmCheckOut = async () => {
  if (!todayAtt?.checkIn || todayAtt?.checkOut || checkingOut) return;

  setCheckingOut(true);

  try {
    await checkOut();

    setShowCheckoutConfirm(false);

    toast.success('You are checked out successfully');

    await fetchAll();
  } catch (error) {
    console.error('Check-out error:', error);

    toast.error(
      error?.response?.data?.message || 'Check-out failed'
    );
  } finally {
    setCheckingOut(false);
  }
};

const cancelCheckOut = () => {
  if (checkingOut) return;

  setShowCheckoutConfirm(false);
};

  /* ---------- derived ---------- */

  const presentDays = attendance.filter(
    (i) => i.status === 'PRESENT' || i.status === 'HALF_DAY'
  ).length;

  const pendingLeaves = leaves.filter((i) => i.status === 'PENDING').length;
  const annualBalance = balance.find((i) => i.leaveType === 'ANNUAL');

  const firstName = user?.name?.split(' ')?.[0] || 'Employee';
  const initials =
    user?.name
      ?.split(' ')
      ?.map((p) => p[0])
      ?.join('')
      ?.slice(0, 2)
      ?.toUpperCase() || 'EM';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const checkInTime = todayAtt?.checkIn ? todayAtt.checkIn.substring(0, 5) : '--:--';
  const checkOutTime = todayAtt?.checkOut ? todayAtt.checkOut.substring(0, 5) : '--:--';

  const working = todayAtt?.checkIn && !todayAtt?.checkOut;
  const dotColor = working ? '#10b981' : todayAtt?.checkOut ? '#f59e0b' : '#94a3b8';

  const quickActions = [
    { label: 'Apply Leave', icon: Palmtree, color: '#8b5cf6', href: '/employee/leave' },
    { label: 'Attendance', icon: CalendarDays, color: '#10b981', href: '/employee/attendance' },
    { label: 'My Profile', icon: UserRound, color: '#3b82f6', href: '/employee/onboarding/profile/' },
    { label: 'Notifications', icon: Bell, color: '#f59e0b', href: '/employee/notifications' },
  ];

  /* ---------- render ---------- */

  return (
    <div className="ed-root">
      <style dangerouslySetInnerHTML={{ __html: dashboardCSS }} />
      {showCheckoutConfirm && (
        <div
          className="ed-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-confirm-title"
          onClick={cancelCheckOut}
        >
          <div
            className="ed-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ed-modal-icon">
              <LogOut size={21} />
            </div>

            <div
              id="checkout-confirm-title"
              className="ed-modal-title"
            >
              Confirm Check Out
            </div>

            <div className="ed-modal-text">
              Are you sure you want to check out?
              Your workday will be marked as completed.
            </div>

            <div className="ed-modal-actions">

              <button
                type="button"
                className="ed-modal-btn ed-modal-cancel"
                onClick={cancelCheckOut}
                disabled={checkingOut}
              >
                Cancel
              </button>

              <button
                type="button"
                className="ed-modal-btn ed-modal-confirm"
                onClick={confirmCheckOut}
                disabled={checkingOut}
              >
                {checkingOut
                  ? 'Checking Out...'
                  : 'Confirm Check Out'}
              </button>

            </div>
          </div>
        </div>
      )}
      {/* HEADER */}
      <div className="ed-card ed-header ed-mb">
        <div className="ed-header-glow" />

        <div className="ed-header-row">
          <div className="ed-user">
            <div className="ed-avatar">{initials}</div>

            <div style={{ minWidth: 0 }}>
              <div className="ed-greeting">
                <span>
                  {greeting}, {firstName}
                </span>
                <Sparkles size={17} color="#f59e0b" />
              </div>

              <div className="ed-sub">
                {user?.designation || 'Employee'}
                {user?.department ? ' • ' + user.department : ''}
              </div>
            </div>
          </div>

          <div className="ed-date">
            <CalendarDays size={14} />
            {formattedDate}
          </div>
        </div>
      </div>

      {loading ? (
        <DashboardLoader />
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="ed-kpis">
            <KPI
              title="Present Days"
              value={presentDays}
              subtitle="Recorded attendance"
              icon={CheckCircle2}
              accent="#10b981"
              onClick={() => router.push('/employee/attendance')}
            />
            <KPI
              title="Annual Leave"
              value={annualBalance ? String(annualBalance.remaining) + ' days' : '0 days'}
              subtitle="Remaining balance"
              icon={Palmtree}
              accent="#8b5cf6"
              onClick={() => router.push('/employee/leave')}
            />
            <KPI
              title="Pending Requests"
              value={pendingLeaves}
              subtitle="Waiting for approval"
              icon={Clock3}
              accent="#f59e0b"
              onClick={() => router.push('/employee/leave')}
            />
            <KPI
              title="Notifications"
              value={unreadCount}
              subtitle="Unread messages"
              icon={Bell}
              accent="#3b82f6"
              onClick={() => router.push('/employee/notifications')}
            />
          </div>

          {/* ATTENDANCE + LEAVE BALANCE */}
          <div className="ed-two">
            {/* Attendance */}
            <div className="ed-card">
              <div className="ed-att-glow" />

              <SectionHeader
                icon={Timer}
                title="Today's Attendance"
                subtitle="Track your working hours"
              />

              <div className="ed-time">
                <div className="ed-time-col">
                  <div className="ed-time-label">CHECK IN</div>
                  <div
                    className="ed-time-value"
                    style={{ color: todayAtt?.checkIn ? '#10b981' : 'var(--text-primary)' }}
                  >
                    {checkInTime}
                  </div>
                  <div className="ed-time-hint">Start of work</div>
                </div>

                <div className="ed-time-divider" />

                <div className="ed-time-col">
                  <div className="ed-time-label">CHECK OUT</div>
                  <div
                    className="ed-time-value"
                    style={{ color: todayAtt?.checkOut ? '#f59e0b' : 'var(--text-primary)' }}
                  >
                    {checkOutTime}
                  </div>
                  <div className="ed-time-hint">End of work</div>
                </div>
              </div>

              <div className="ed-status-row">
                <div className="ed-status-left">
                  <span
                    className="ed-dot"
                    style={{
                      background: dotColor,
                      boxShadow: working ? '0 0 0 4px rgba(16,185,129,.10)' : 'none',
                    }}
                  />
                  <span className="ed-status-text">
                    {todayAtt?.checkOut
                      ? 'Workday completed'
                      : todayAtt?.checkIn
                        ? 'Currently working'
                        : 'Not checked in yet'}
                  </span>
                </div>

                {todayAtt?.status && <StatusBadge status={todayAtt.status} />}
              </div>

              <div className="ed-btns">
                <button
                  type="button"
                  className="ed-btn"
                  onClick={handleCheckIn}
                  disabled={!!todayAtt?.checkIn || checkingIn}
                  style={{
                    background: todayAtt?.checkIn ? 'rgba(16,185,129,.10)' : '#10b981',
                    color: todayAtt?.checkIn ? '#10b981' : '#fff',
                    cursor: todayAtt?.checkIn || checkingIn ? 'not-allowed' : 'pointer',
                    opacity: checkingIn ? 0.7 : 1,
                  }}
                >
                  {todayAtt?.checkIn ? <CheckCircle2 size={15} /> : <LogIn size={15} />}
                  {checkingIn ? 'Checking...' : todayAtt?.checkIn ? 'Checked In' : 'Check In'}
                </button>

                <button
                  type="button"
                  className="ed-btn"
                  onClick={handleCheckOut}
                  disabled={!todayAtt?.checkIn || !!todayAtt?.checkOut || checkingOut}
                  style={{
                    background: todayAtt?.checkOut
                      ? 'rgba(245,158,11,.10)'
                      : todayAtt?.checkIn
                        ? '#f59e0b'
                        : 'var(--bg-primary)',
                    color: todayAtt?.checkOut
                      ? '#f59e0b'
                      : todayAtt?.checkIn
                        ? '#fff'
                        : 'var(--text-secondary)',
                    cursor:
                      !todayAtt?.checkIn || todayAtt?.checkOut || checkingOut
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: !todayAtt?.checkIn ? 0.55 : checkingOut ? 0.7 : 1,
                  }}
                >
                  <LogOut size={15} />
                  {checkingOut ? 'Checking...' : todayAtt?.checkOut ? 'Checked Out' : 'Check Out'}
                </button>
              </div>
            </div>

            {/* Leave balance */}
            <div className="ed-card">
              <SectionHeader
                icon={Palmtree}
                title="Leave Balance"
                subtitle="Your available leave days"
                action="Manage"
                onAction={() => router.push('/employee/leave')}
              />

              {balance.length === 0 ? (
                <EmptyState
                  icon={Palmtree}
                  title="No leave balance"
                  text="Leave balance information is not available right now."
                />
              ) : (
                <div className="ed-leaves">
                  {balance.map((item, index) => {
                    const st = leaveStyles[item.leaveType] || leaveStyles.UNPAID;
                    const Icon = st.icon;
                    const total = Number(item.totalAllotted) || 0;
                    const remaining = Number(item.remaining) || 0;
                    const percentage =
                      total > 0 ? Math.min(100, (remaining / total) * 100) : 0;

                    return (
                      <div
                        key={item.leaveType + '-' + index}
                        className="ed-lb"
                        style={{ background: st.bg }}
                      >
                        <LeaveRing percentage={percentage} color={st.color} />

                        <div className="ed-lb-body">
                          <div className="ed-lb-type" style={{ color: st.color }}>
                            <Icon size={12} />
                            {item.leaveType ? item.leaveType.replace(/_/g, ' ') : 'LEAVE'}
                          </div>

                          <div className="ed-lb-value">
                            {item.leaveType === 'UNPAID' ? item.used || 0 : remaining}
                            <small>
                              {item.leaveType === 'UNPAID' ? 'used' : '/ ' + total + ' days'}
                            </small>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="ed-card ed-mb">
            <SectionHeader
              icon={BriefcaseBusiness}
              title="Quick Actions"
              subtitle="Fast track your tasks"
            />

            <div className="ed-actions">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className="ed-qa"
                  onClick={() => router.push(a.href)}
                >
                  <a.icon size={16} color={a.color} style={{ flexShrink: 0 }} />
                  <span>{a.label}</span>
                  <ArrowRight size={13} style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>

          {/* RECENT LEAVES + NOTIFICATIONS */}
          <div className="ed-bottom">
            {/* Recent leaves */}
            <div className="ed-card">
              <SectionHeader
                icon={FileText}
                title="Recent Leave Requests"
                subtitle="Latest leave activity"
                action="View all"
                onAction={() => router.push('/employee/leave')}
              />

              {leaves.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No leave requests"
                  text="You haven't submitted any leave requests yet."
                />
              ) : (
                <div id="ed-leave-rows">
                  {leaves.slice(0, 4).map((leave, index) => (
                    <div key={leave.id || index} className="ed-row">
                      <div className="ed-row-left">
                        <div
                          className="ed-row-icon"
                          style={{ background: 'rgba(139,92,246,.10)', color: '#8b5cf6' }}
                        >
                          <Palmtree size={17} />
                        </div>

                        <div className="ed-row-main">
                          <div className="ed-row-title">
                            {leave.leaveType ? leave.leaveType.replace(/_/g, ' ') : 'Leave'} Leave
                          </div>
                          <div className="ed-row-sub">
                            {leave.startDate || '--'} – {leave.endDate || '--'}
                          </div>
                        </div>
                      </div>

                      <div className="ed-row-right">
                        <span className="ed-row-days">{leave.totalDays || 0} days</span>
                        <StatusBadge status={leave.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="ed-card">
              <SectionHeader
                icon={Bell}
                title="Recent Notifications"
                subtitle="Stay up to date"
                action="View all"
                onAction={() => router.push('/employee/notifications')}
              />

              {notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="You're all caught up"
                  text="There are no new notifications to show."
                />
              ) : (
                <div>
                  {notifications.slice(0, 4).map((n, index) => (
                    <div key={n.id || index} className="ed-row">
                      <div className="ed-row-left">
                        <div
                          className="ed-row-icon"
                          style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                        >
                          <Bell size={17} />
                        </div>

                        <div className="ed-row-main">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div className="ed-row-title">{n.title || 'Notification'}</div>
                            {!n.isRead && <span className="ed-unread" />}
                          </div>
                          <div className="ed-row-sub">{n.message || ''}</div>
                        </div>
                      </div>

                      <div className="ed-row-days" style={{ fontWeight: 500 }}>
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })
                          : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="ed-footer">
            <TrendingUp size={12} />
            Your dashboard is synced with the latest HRMS data.
          </div>
        </>
      )}
    </div>
  );
}