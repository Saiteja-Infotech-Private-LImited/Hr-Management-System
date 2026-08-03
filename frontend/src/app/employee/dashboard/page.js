'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  getMyAttendance, checkIn, checkOut,
  getMyLeaves, getLeaveBalance,
  getUnreadCount, getMyNotifications
} from '@/lib/employeeApi';
import toast from 'react-hot-toast';
import { Calendar, CheckCircle, Clock, Bell } from 'lucide-react';

function StatCard({ label, value, sub, colorClass, icon }) {
  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-[28px] font-extrabold text-slate-900 dark:text-white mb-1 leading-none">{value}</div>
        <div className="text-[12px] font-medium text-slate-400 dark:text-slate-500">{sub}</div>
      </div>
    </div>
  );
}

function Badge({ status }) {
  const map = {
    APPROVED: { bg: 'bg-emerald-100 dark:bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
    PENDING: { bg: 'bg-amber-100 dark:bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400' },
    REJECTED: { bg: 'bg-rose-100 dark:bg-rose-500/10', color: 'text-rose-600 dark:text-rose-400' },
    CANCELLED: { bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-500 dark:text-slate-400' },
    CANCELLATION_PENDING: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/10', color: 'text-fuchsia-600 dark:text-fuchsia-400' },
    PRESENT: { bg: 'bg-emerald-100 dark:bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
    ABSENT: { bg: 'bg-rose-100 dark:bg-rose-500/10', color: 'text-rose-600 dark:text-rose-400' },
    HALF_DAY: { bg: 'bg-amber-100 dark:bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400' },
  };
  const s = map[status] || { bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-500 dark:text-slate-400' };
  return (
    <span className={`${s.bg} ${s.color} px-3 py-1 rounded-full text-[11px] font-bold tracking-wider w-fit inline-flex`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user } = useSelector((state) => state.auth);

  const [attendance, setAttendance] = useState(null);
  const [todayAtt, setTodayAtt] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, leaveRes, balRes, notifRes, unreadRes] = await Promise.allSettled([
        getMyAttendance(0, 35),
        getMyLeaves(0, 5),
        getLeaveBalance(),
        getMyNotifications(0, 5),
        getUnreadCount(),
      ]);

      if (attRes.status === 'fulfilled') {
        const records = attRes.value.data?.data?.content || [];
        setAttendance(records);
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const todayRecord = records.find(r => r.date === today);
        setTodayAtt(todayRecord || null);
      }
      if (leaveRes.status === 'fulfilled') {
        setLeaves(leaveRes.value.data?.data?.content || []);
      }
      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data?.data || []);
      }
      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data?.data?.content || []);
      }
      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.data?.data || 0);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchAll(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await checkIn();
      toast.success('Checked in successfully!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await checkOut();
      toast.success('Checked out successfully!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const presentDays = attendance?.filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').length || 0;
  const annualBalance = balance.find(b => b.leaveType === 'ANNUAL');
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
          Dashboard
        </h1>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
          Welcome back, {user?.name?.split(' ')[0] || 'Employee'}! Here's your overview for today.
        </p>
      </div>

      {loading ? <Loader /> : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Present Days"
              value={presentDays}
              sub="This month"
              colorClass="bg-[#DBFF00]/10 text-[#DBFF00]"
              icon={<Calendar className="w-5 h-5" />}
            />
            <StatCard
              label="Leave Balance"
              value={annualBalance ? `${annualBalance.remaining} days` : '—'}
              sub="Annual remaining"
              colorClass="bg-[#a855f7]/10 text-[#a855f7]"
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <StatCard
              label="Pending Leaves"
              value={pendingLeaves}
              sub="Awaiting approval"
              colorClass="bg-[#0ea5e9]/10 text-[#0ea5e9]"
              icon={<Clock className="w-5 h-5" />}
            />
            <StatCard
              label="Notifications"
              value={unreadCount}
              sub="Unread alerts"
              colorClass="bg-[#f97316]/10 text-[#f97316]"
              icon={<Bell className="w-5 h-5" />}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Today Attendance */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-colors">
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#10b981] dark:text-[#DBFF00]" /> Today's Attendance
              </h3>
              
              <div className="flex justify-around mb-6 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 dark:bg-white/5 -translate-x-1/2"></div>
                
                <div className="text-center z-10 bg-white dark:bg-[#111827] px-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Check In</div>
                  <div className={`text-[24px] font-black ${todayAtt?.checkIn ? 'text-[#10b981] dark:text-[#DBFF00]' : 'text-slate-400 dark:text-slate-600'}`}>
                    {todayAtt?.checkIn ? todayAtt.checkIn.substring(0, 5) : '--:--'}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-1">
                    {new Date().toLocaleDateString('en-IN')}
                  </div>
                </div>
                
                <div className="text-center z-10 bg-white dark:bg-[#111827] px-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Check Out</div>
                  <div className={`text-[24px] font-black ${todayAtt?.checkOut ? 'text-[#f97316]' : 'text-slate-400 dark:text-slate-600'}`}>
                    {todayAtt?.checkOut ? todayAtt.checkOut.substring(0, 5) : '--:--'}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 mt-1">
                    {todayAtt?.workHours ? `${todayAtt.workHours}h worked` : 'Not yet'}
                  </div>
                </div>
              </div>

              {/* Status badge */}
              {todayAtt && (
                <div className="text-center mb-6">
                  <Badge status={todayAtt.status} />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleCheckIn}
                  disabled={!!todayAtt?.checkIn || checkingIn}
                  className={`flex-1 py-3 px-4 rounded-xl text-[13px] font-bold transition-all ${
                    todayAtt?.checkIn 
                      ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5' 
                      : 'bg-[#10b981]/10 dark:bg-[#DBFF00]/10 text-[#10b981] dark:text-[#DBFF00] hover:bg-[#10b981]/20 dark:hover:bg-[#DBFF00]/20 border border-[#10b981]/20 dark:border-[#DBFF00]/20 shadow-sm'
                  }`}
                >
                  {checkingIn ? '⏳ Processing...' : todayAtt?.checkIn ? '✓ Checked In' : 'Check In'}
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={!todayAtt?.checkIn || !!todayAtt?.checkOut || checkingOut}
                  className={`flex-1 py-3 px-4 rounded-xl text-[13px] font-bold transition-all ${
                    (todayAtt?.checkOut || !todayAtt?.checkIn)
                      ? 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-white/5' 
                      : 'bg-[#f97316]/10 text-[#f97316] hover:bg-[#f97316]/20 border border-[#f97316]/20 shadow-sm'
                  }`}
                >
                  {checkingOut ? '⏳ Processing...' : todayAtt?.checkOut ? '✓ Checked Out' : 'Check Out'}
                </button>
              </div>
            </div>

            {/* Leave Balance */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-colors">
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#a855f7]" /> Leave Balance
              </h3>
              
              {balance.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 text-[13px] py-10 font-medium">
                  No leave balance data found
                </div>
              ) : (
                <div className="space-y-5">
                  {balance.map((b, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{b.leaveType}</span>
                        <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">{b.remaining} <span className="text-slate-400 dark:text-slate-500 font-medium">/ {b.totalAllotted} days</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-[#1e293b] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            b.leaveType === 'ANNUAL' ? 'bg-[#a855f7]' : 
                            b.leaveType === 'SICK' ? 'bg-[#0ea5e9]' : 
                            b.leaveType === 'CASUAL' ? 'bg-[#f97316]' : 'bg-[#10b981] dark:bg-[#DBFF00]'
                          }`}
                          style={{ width: `${(b.remaining / b.totalAllotted) * 100}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Leave Requests */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0ea5e9]" /> Recent Leave Requests
                </h3>
              </div>
              
              {leaves.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 text-[13px] py-10 font-medium">
                  No leave requests found
                </div>
              ) : (
                <div className="space-y-1">
                  {leaves.slice(0, 4).map((l, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div>
                        <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{l.leaveType} Leave</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-0.5">{l.startDate} – {l.endDate} &middot; {l.totalDays} day(s)</div>
                      </div>
                      <Badge status={l.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Notifications */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#f97316]" /> Recent Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-[#f97316]/10 text-[#f97316] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="text-center text-slate-400 dark:text-slate-500 text-[13px] py-10 font-medium">
                  No notifications found
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.slice(0, 4).map((n, i) => (
                    <div key={i} className="flex gap-3 items-start py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-slate-200 dark:bg-slate-700' : 'bg-[#f97316]'}`} />
                      <div>
                        <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-0.5">{n.title}</div>
                        <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-snug">{n.message?.substring(0, 60)}...</div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-wider">
                          {new Date(n.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
