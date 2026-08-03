'use client';
import { useEffect, useState } from 'react';
import { getEmployeeDetailedReport, exportEmployeeAttendanceRange } from '@/lib/adminApi';
import { downloadBlob } from '@/lib/downloadFile';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    PRESENT: { bg: '#dcfce7', color: '#16a34a' },
    HALF_DAY: { bg: '#fff7ed', color: '#f59e0b' },
    ON_LEAVE: { bg: '#eff6ff', color: '#3b82f6' },
    ABSENT: { bg: '#fee2e2', color: '#dc2626' },
    WEEKEND: { bg: '#f1f5f9', color: 'var(--text-secondary)' },
    HOLIDAY: { bg: '#fdf4ff', color: '#9333ea' },
};

function StatusBadge({ status }) {
    const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)' };
    return (
        <span style={{
            background: s.bg, color: s.color,
            padding: '3px 10px', borderRadius: '20px',
            fontSize: '11px', fontWeight: '700',
        }}>
            {status?.replace(/_/g, ' ')}
        </span>
    );
}

function DayCell({ day }) {
    const s = STATUS_COLORS[day.status] || { bg: '#f1f5f9', color: 'var(--text-secondary)' };
    const shortLabel = day.status === 'PRESENT' ? 'P'
        : day.status === 'HALF_DAY' ? 'H'
            : day.status === 'ON_LEAVE' ? 'L'
                : day.status === 'WEEKEND' ? 'WK'
                    : day.status === 'HOLIDAY' ? 'HO'
                        : 'A';
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{day.dayName}</div>
            <div style={{
                width: '32px', height: '32px', borderRadius: '6px',
                background: s.bg, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700', margin: '0 auto',
            }} title={`${day.date} · ${day.status}`}>
                {shortLabel}
            </div>
        </div>
    );
}

export default function EmployeeAttendanceModal({ employeeId, asOfDate, onClose }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(asOfDate ? asOfDate.slice(0, 8) + '01' : '');
    const [toDate, setToDate] = useState(asOfDate);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        let active = true;
        getEmployeeDetailedReport(employeeId, asOfDate)
            .then((res) => {
                if (active) setReport(res.data?.data || null);
            })
            .catch((err) => {
                toast.error(err.response?.data?.message || 'Failed to load employee report');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [employeeId, asOfDate]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await exportEmployeeAttendanceRange(employeeId, fromDate, toDate);
            downloadBlob(res, `attendance_emp${employeeId}_${fromDate}_to_${toDate}.xlsx`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '20px',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--panel-bg)', borderRadius: '14px', width: '460px',
                    maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto',
                    padding: '20px 24px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading...</div>
                ) : !report ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                        No report available.
                        <div style={{ marginTop: '16px' }}>
                            <button onClick={onClose} style={closeBtnStyle}>Close</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                    {report.employeeName} <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>({report.employeeCode})</span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {report.departmentName}
                                </div>
                            </div>
                            <button onClick={onClose} aria-label="Close" style={{
                                border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1,
                            }}>
                                ✕
                            </button>
                        </div>

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                            borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginBottom: '16px',
                        }}>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px' }}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>to</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                style={{ padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px' }}
                            />
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                style={{
                                    marginLeft: 'auto', padding: '6px 14px', background: 'var(--primary-color)', color: 'white',
                                    border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                                    cursor: exporting ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {exporting ? 'Exporting...' : '⬇ Export'}
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                                Yesterday ({report.yesterdayDate})
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                <StatusBadge status={report.yesterdayStatus} />
                                <span>Hours: {report.yesterdayWorkHours ?? 0}</span>
                                {report.yesterdayCheckIn && (
                                    <span>In: {String(report.yesterdayCheckIn).slice(0, 5)} · Out: {report.yesterdayCheckOut ? String(report.yesterdayCheckOut).slice(0, 5) : '--'}</span>
                                )}
                            </div>
                            {report.yesterdayRemarks && (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                                    &quot;{report.yesterdayRemarks}&quot;
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
                                This week
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                {report.weeklyRecords?.map((d) => <DayCell key={d.date} day={d} />)}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                                P: {report.weeklyStats?.presentCount ?? 0} &nbsp;
                                H: {report.weeklyStats?.halfDayCount ?? 0} &nbsp;
                                A: {report.weeklyStats?.absentCount ?? 0} &nbsp;
                                L: {report.weeklyStats?.leaveCount ?? 0} &nbsp;
                                Avg hrs: {report.weeklyStats?.avgWorkHours ?? 0}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '10px' }}>
                                This month
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Attendance</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                        {report.monthlyStats?.attendancePercent ?? 0}%
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-input)', borderRadius: '10px', padding: '10px 12px' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Total hours</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                        {report.monthlyStats?.totalWorkHours ?? 0}
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Present: {report.monthlyStats?.presentCount ?? 0} &nbsp;
                                Half: {report.monthlyStats?.halfDayCount ?? 0} &nbsp;
                                Absent: {report.monthlyStats?.absentCount ?? 0} &nbsp;
                                Leave: {report.monthlyStats?.leaveCount ?? 0} &nbsp;
                                Working days: {report.monthlyStats?.workingDays ?? 0}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const closeBtnStyle = {
    padding: '8px 20px', background: '#f1f5f9', border: 'none',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600',
    color: '#334155', cursor: 'pointer',
};