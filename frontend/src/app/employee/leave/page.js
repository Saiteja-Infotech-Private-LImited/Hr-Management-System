'use client';
import { useState, useEffect, useCallback } from 'react';
import { getMyLeaves, getLeaveBalance } from '@/lib/employeeApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

function Badge({ status }) {
  const map = {
    APPROVED:             { bg: '#dcfce7', color: '#16a34a' },
    PENDING:              { bg: '#fef9c3', color: '#ca8a04' },
    REJECTED:             { bg: '#fee2e2', color: '#dc2626' },
    CANCELLED:            { bg: '#f1f5f9', color: 'var(--text-secondary)' },
    CANCELLATION_PENDING: { bg: '#fdf4ff', color: '#9333ea' },
    HR_PENDING:           { bg: '#fff7ed', color: '#f59e0b' },
    MANAGER_PENDING:      { bg: '#eff6ff', color: '#3b82f6' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 12px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700',
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

const LEAVE_TYPES = ['ANNUAL', 'SICK', 'CASUAL', 'PATERNITY', 'MATERNITY', 'UNPAID'];

export default function LeavePage() {
  const [leaves, setLeaves]         = useState([]);
  const [balance, setBalance]       = useState([]);
  const [managers, setManagers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [form, setForm] = useState({
    leaveType:  'ANNUAL',
    startDate:  '',
    endDate:    '',
    reason:     '',
    managerId:  '',
  });
  const [attachmentFile, setAttachmentFile] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [leaveRes, balRes] = await Promise.allSettled([
        getMyLeaves(page, 8),
        getLeaveBalance(),
      ]);
      if (leaveRes.status === 'fulfilled') {
        const data = leaveRes.value.data?.data;
        setLeaves(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }
      if (balRes.status === 'fulfilled') {
        setBalance(balRes.value.data?.data || []);
      }
    } catch (err) {
      toast.error('Failed to load leave data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchManagers = useCallback(async () => {
    try {
      const res = await api.get('/api/employees/managers');
      console.log('Full response:', res);
      console.log('Response data:', res.data);
      console.log('Response data.data:', res.data?.data);

      const all =
        res.data?.data?.content ||   // paginated
        res.data?.data ||            // list directly
        res.data?.content ||         // another format
        res.data ||                  // raw data
        [];

      console.log('Managers list:', all);
      console.log('Managers count:', all.length);

      if (Array.isArray(all) && all.length > 0) {
        setManagers(all);
        setForm(prev => ({ ...prev, managerId: all[0].id }));
      } else {
        console.warn('No managers found in response');
      }
    } catch (err) {
      console.error('fetchManagers status:', err.response?.status);
      console.error('fetchManagers data:', err.response?.data);
      console.error('fetchManagers message:', err.message);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAll();
      fetchManagers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAll, fetchManagers]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    if (!form.managerId) {
      toast.error('Please select a manager');
      return;
    }
    setSubmitting(true);
    try {
      let attachmentUrl = null;
      let attachmentFileName = null;
      
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('file', attachmentFile);
        const uploadRes = await api.post('/api/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        attachmentUrl = uploadRes.data?.data?.url;
        attachmentFileName = uploadRes.data?.data?.fileName;
      }

      await api.post('/api/leaves/apply', {
        leaveType:  form.leaveType,
        startDate:  form.startDate,
        endDate:    form.endDate,
        reason:     form.reason,
        managerId:  parseInt(form.managerId),
        ...(attachmentUrl && { attachmentUrl, attachmentFileName })
      });
      toast.success('Leave applied successfully!');
      setShowForm(false);
      setForm({
        leaveType: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: '',
        managerId: managers.length > 0 ? managers[0].id : '',
      });
      setAttachmentFile(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await api.put(`/api/leaves/${id}/cancel`, { reason: 'Cancelled by employee' });
      toast.success('Leave cancelled successfully!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel leave');
    } finally {
      setCancelling(null);
    }
  };

  const balanceColors = {
    ANNUAL:    { color: '#3b82f6', bg: '#eff6ff', icon: '📅' },
    SICK:      { color: '#16a34a', bg: '#dcfce7', icon: '🏥' },
    CASUAL:    { color: '#f59e0b', bg: '#fff7ed', icon: '☀️' },
    PATERNITY: { color: '#8b5cf6', bg: '#fdf4ff', icon: '👶' },
    MATERNITY: { color: '#ec4899', bg: '#fdf2f8', icon: '🤱' },
    UNPAID:    { color: 'var(--text-secondary)', bg: '#f1f5f9', icon: '📋' },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Leave Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Apply for leave, track status and check your balance
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            background: 'var(--primary-color)', color: 'white',
            border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '700',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '6px',
          }}
        >
          + Apply Leave
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {balance.length === 0 ? (
          ['ANNUAL', 'SICK', 'CASUAL', 'PATERNITY'].map(type => {
            const c = balanceColors[type];
            return (
              <div key={type} style={{ background: 'var(--panel-bg)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{c.icon}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{type}</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#cbd5e1' }}>—</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>No data</div>
              </div>
            );
          })
        ) : (
          balance.map((b, i) => {
            const c = balanceColors[b.leaveType] || balanceColors.UNPAID;
            const pct = b.totalAllotted > 0
              ? (b.remaining / b.totalAllotted) * 100
              : 0;
            return (
              <div key={i} style={{
                background: 'var(--panel-bg)', borderRadius: '12px', padding: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>{b.leaveType}</span>
                  <span style={{ fontSize: '18px' }}>{c.icon}</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: c.color, marginBottom: '2px' }}>
                  {b.remaining}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  of {b.totalAllotted} days remaining
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: '3px', transition: 'width 0.5s' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Used: {b.used}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Total: {b.totalAllotted}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Apply Leave Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '20px',
        }}>
          <div style={{
            background: 'var(--panel-bg)', borderRadius: '16px',
            padding: '28px', width: '100%', maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Apply for Leave
              </h2>
              <button onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleApply}>

              {/* Leave Type */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Leave Type <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={form.leaveType}
                  onChange={e => setForm({ ...form, leaveType: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1.5px solid var(--border-color)', borderRadius: '10px',
                    fontSize: '13px', outline: 'none', background: 'var(--panel-bg)',
                  }}
                >
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    Start Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '10px 12px',
                      border: '1.5px solid var(--border-color)', borderRadius: '10px',
                      fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                    End Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '10px 12px',
                      border: '1.5px solid var(--border-color)', borderRadius: '10px',
                      fontSize: '13px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Manager Dropdown */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Send To (Manager) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={form.managerId}
                  onChange={e => setForm({ ...form, managerId: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1.5px solid var(--border-color)', borderRadius: '10px',
                    fontSize: '13px', outline: 'none', background: 'var(--panel-bg)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                >
                  <option value="">Select Manager / HR...</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} — {m.role}
                      {m.department ? ` (${m.department})` : ''}
                    </option>
                  ))}
                </select>
                {managers.length === 0 && (
                  <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                    No managers found. Contact admin.
                  </div>
                )}
              </div>

              {/* Reason */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Enter reason for leave..."
                  required
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1.5px solid var(--border-color)', borderRadius: '10px',
                    fontSize: '13px', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              {/* Attachment */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Attachment (Optional)
                </label>
                <input
                  type="file"
                  onChange={e => setAttachmentFile(e.target.files[0])}
                  style={{
                    width: '100%', padding: '8px 12px',
                    border: '1.5px dashed var(--border-color)', borderRadius: '10px',
                    fontSize: '13px', outline: 'none', background: 'var(--panel-bg)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'var(--panel-bg)', color: 'var(--text-primary)',
                    border: '1.5px solid var(--border-color)', borderRadius: '10px',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  style={{
                    flex: 1, padding: '12px',
                    background: 'var(--primary-color)', color: 'white',
                    border: 'none', borderRadius: '10px',
                    fontSize: '14px', fontWeight: '700',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}>
                  {submitting ? '⏳ Submitting...' : 'Submit Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave History Table */}
      <div className="table-responsive" style={{
        background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border-color)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
            My Leave Requests
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {leaves.length} records
          </span>
        </div>

        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 0.5fr 1.5fr 1fr 1fr',
          padding: '10px 20px', background: 'var(--bg-input)',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {['Leave Type', 'From', 'To', 'Days', 'Status', 'Applied On', 'Action'].map(h => (
            <div key={h} style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {h}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading...
          </div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌴</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              No leave requests yet
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Apply for your first leave using the button above
            </div>
            <button onClick={() => setShowForm(true)}
              style={{ padding: '10px 20px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              + Apply Leave
            </button>
          </div>
        ) : (
          <>
            {leaves.map((l, i) => (
              <div key={l.id || i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 0.5fr 1.5fr 1fr 1fr',
                  padding: '13px 20px', borderBottom: '1px solid var(--border-light)',
                  alignItems: 'center',
                }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {l.leaveType} Leave
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{l.startDate}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{l.endDate}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {l.totalDays}
                </div>
                <div><Badge status={l.status}/></div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {l.appliedAt
                    ? new Date(l.appliedAt).toLocaleDateString('en-IN')
                    : '--'}
                </div>
                <div>
                  {(l.status === 'PENDING' ||
                    l.status === 'MANAGER_PENDING' ||
                    l.status === 'HR_PENDING') && (
                    <button
                      onClick={() => handleCancel(l.id)}
                      disabled={cancelling === l.id}
                      style={{
                        padding: '5px 12px',
                        background: '#fee2e2', color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '6px', fontSize: '11px',
                        fontWeight: '700', cursor: 'pointer',
                      }}>
                      {cancelling === l.id ? '⏳' : 'Cancel'}
                    </button>
                  )}
                  {l.status === 'APPROVED' && (
                    <button
                      onClick={() => handleCancel(l.id)}
                      disabled={cancelling === l.id}
                      style={{
                        padding: '5px 12px',
                        background: '#fdf4ff', color: '#9333ea',
                        border: '1px solid #e9d5ff',
                        borderRadius: '6px', fontSize: '11px',
                        fontWeight: '700', cursor: 'pointer',
                      }}>
                      {cancelling === l.id ? '⏳' : 'Request Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'center', gap: '8px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{ padding: '6px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page === 0 ? '#cbd5e1' : '#374151', background: 'var(--panel-bg)', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>
                <span style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{ padding: '6px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: page >= totalPages - 1 ? '#cbd5e1' : '#374151', background: 'var(--panel-bg)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}