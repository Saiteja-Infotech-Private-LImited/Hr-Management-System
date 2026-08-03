'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getAllEmployees,
  searchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Download, Search as SearchIcon, ChevronDown, Eye, MoreVertical, Plus } from "lucide-react";
import { useRouter } from 'next/navigation';

function Badge({ status }) {
  const map = {
    ACTIVE: { bg: '#dcfce7', color: '#16a34a' },
    INACTIVE: { bg: '#fee2e2', color: '#dc2626' },
    ADMIN: { bg: '#dbeafe', color: '#1d4ed8' },
    HR: { bg: '#fdf4ff', color: '#9333ea' },
    EMPLOYEE: { bg: '#f1f5f9', color: 'var(--text-primary)' },
    'ON BOARDING': { bg: '#fef3c7', color: '#d97706' },
    PROBATION: { bg: '#f3e8ff', color: '#9333ea' },
    'ON LEAVE': { bg: '#ffe4e6', color: '#e11d48' },
  };
  
  // Try to mock the specific mock statuses for visual matching
  let displayStatus = status;
  if (status === 'INACTIVE') displayStatus = 'ON LEAVE';
  
  const style = map[displayStatus] || map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)' };
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: style.bg, padding: '4px 10px', borderRadius: '6px', width: 'fit-content' }}>
      <span style={{ fontSize: '10px', fontWeight: '800', color: style.color, textTransform: 'uppercase' }}>
        {displayStatus}
      </span>
      <ChevronDown size={12} color={style.color} />
    </div>
  );
}

function InputField({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  value,
  onChange,
  max,
  maxLength,
  numericOnly,
}) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '5px' }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => {
          let val = e.target.value;
          if (numericOnly) {
            // Strip anything that isn't a digit — blocks letters and special characters
            val = val.replace(/[^0-9]/g, '');
          }
          if (maxLength) {
            val = val.slice(0, maxLength);
          }
          onChange(name, val);
        }}
        onKeyPress={e => {
          if (numericOnly && !/[0-9]/.test(e.key)) {
            e.preventDefault();
          }
        }}
        onPaste={e => {
          if (numericOnly) {
            const pasted = e.clipboardData.getData('text');
            if (/[^0-9]/.test(pasted)) {
              e.preventDefault();
            }
          }
        }}
        placeholder={placeholder}
        required={required}
        max={max}
        maxLength={maxLength}
        inputMode={numericOnly ? 'numeric' : undefined}
        style={{
          width: '100%',
          padding: '9px 12px',
          border: '1.5px solid #e2e8f0',
          borderRadius: '8px',
          fontSize: '13px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#3b82f6'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
    </div>
  );
}

const EMPTY_FORM = {
  employeeId: "", firstName: '', lastName: '', email: '',
  password: '', phone: '', department: '',
  designation: '', basicSalary: '',
  dateOfJoining: '', dateOfBirth: '',
  role: 'EMPLOYEE',
};

export default function EmployeeManagementPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllEmployees(page, 10);
      const data = res.data?.data;
      setEmployees(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await searchEmployees(search, page, 10);
      const data = res.data?.data;
      setEmployees(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) {
        handleSearch();
      } else {
        fetchEmployees();
      }
    }, search.trim() ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search, page, handleSearch, fetchEmployees]);

  const openAddForm = () => {
    setEditMode(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (emp) => {
    setEditMode(true);
    setEditId(emp.id);
    setForm({
      employeeId: emp.employeeId || '',
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      password: '',
      phone: emp.phone || '',
      department: emp.department || '',
      designation: emp.designation || '',
      basicSalary: emp.basicSalary || '',
      dateOfJoining: emp.dateOfJoining || '',
      dateOfBirth: emp.dateOfBirth || '',
      role: emp.role || 'EMPLOYEE',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.phone && form.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0,
      };
      if (editMode) {
        if (!payload.password) delete payload.password;
        await updateEmployee(editId, payload);
        toast.success('Employee updated successfully!');
      } else {
        await createEmployee(payload);
        toast.success('Employee created successfully!');
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteEmployee(id);
      toast.success('Employee deleted successfully!');
      setShowDeleteConfirm(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleFieldChange = (name, val) => setForm(prev => ({ ...prev, [name]: val }));

  return (
    <div className="max-w-[1400px] mx-auto bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 dark:text-white leading-tight">
            Employees
          </h1>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">
            Manage your Employee
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download size={16} />
            Download
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-[13px] font-bold transition-colors shadow-lg shadow-slate-900/20"
          >
            <Plus size={16} />
            Add New
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee"
            className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-300 dark:focus:border-slate-500 transition-colors"
          />
          {searching && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold bg-white dark:bg-slate-800 px-2">
              Searching...
            </span>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
          <div className="relative shrink-0">
            <select className="appearance-none bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-5 pr-10 py-3 text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 cursor-pointer w-36">
              <option>All Offices</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative shrink-0">
            <select className="appearance-none bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-5 pr-10 py-3 text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 cursor-pointer w-[140px]">
              <option>All Job Titles</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
          <div className="relative shrink-0">
            <select className="appearance-none bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl pl-5 pr-10 py-3 text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 cursor-pointer w-[120px]">
              <option>All Status</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Table Header */}
          <div className="grid grid-cols-[auto_1.8fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 py-4 px-2 border-b-2 border-slate-100 dark:border-slate-800 mb-2">
            <div className="w-5"></div> {/* Checkbox placeholder */}
            {['Employee Name', 'Job Title', 'Line Manager', 'Department', 'Office', 'Employee Status', 'Account'].map(h => (
              <div key={h} className="text-[12px] font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between">
                {h}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
              </div>
            ))}
            <div className="w-[80px]"></div> {/* Actions */}
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500 font-medium text-sm">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-4xl mb-4 opacity-50">👥</div>
              <div className="text-[15px] font-bold text-slate-900 dark:text-white mb-2">
                {search ? 'No employees found' : 'No employees yet'}
              </div>
              <div className="text-[13px] text-slate-500 mb-6">
                {search ? `No results for "${search}"` : 'Add your first employee to get started'}
              </div>
              {!search && (
                <button onClick={openAddForm} className="px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-[13px] font-bold shadow-lg">
                  + Add Employee
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {employees.map((emp, i) => (
                <div key={emp.id} className="grid grid-cols-[auto_1.8fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 py-3 px-2 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl items-center transition-colors">
                  {/* Checkbox Mock */}
                  <div className="w-5 h-5 rounded-[6px] border-2 border-slate-200 dark:border-slate-600"></div>

                  {/* Profile */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${emp.id}`} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                    <div style={{ display: 'none' }} className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex-shrink-0 items-center justify-center text-xs font-bold">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[12px] font-medium text-slate-400 truncate">
                        {emp.email}
                      </div>
                    </div>
                  </div>

                  {/* Job Title */}
                  <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    {emp.designation || 'Designer'}
                  </div>

                  {/* Line Manager Mock */}
                  <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    @Pristiacandra
                  </div>

                  {/* Department */}
                  <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    {emp.department || 'Team Product'}
                  </div>

                  {/* Office Mock */}
                  <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 truncate">
                    Unpixel Office
                  </div>

                  {/* Status */}
                  <Badge status={emp.active ? 'ACTIVE' : 'INACTIVE'} />

                  {/* Account */}
                  <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                    {emp.active ? 'Activated' : 'Need Invitation'}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <button 
                      onClick={() => router.push(`/admin/employees/detail?id=${emp.id}`)}
                      className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                      title="View / Edit"
                    >
                      <Eye size={14} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(emp)}
                      className="w-6 h-8 rounded-[10px] bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
                      title="Options"
                    >
                      <MoreVertical size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center py-6 mt-2 border-t-2 border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))} 
                disabled={page === 0}
                className="w-8 h-8 rounded-lg border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-600 disabled:opacity-50"
              >
                &lt;
              </button>
              
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setPage(idx)}
                    className={`w-8 h-8 rounded-lg text-[13px] font-bold flex items-center justify-center transition-colors ${page === idx ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} 
                disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-slate-200 hover:text-slate-600 disabled:opacity-50"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Employee Slide-out Panel */}
      {showForm && (
        <>
          <div 
            onClick={() => setShowForm(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
              zIndex: 90, transition: 'opacity 0.3s'
            }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '450px',
            background: 'var(--panel-bg)', zIndex: 100,
            boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out'
          }}>
            <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {editMode ? 'Edit Profile' : 'Add New Profile'}
              </h2>
            </div>

            <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
              <form id="employeeForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <InputField label="First Name" name="firstName" required placeholder="Pristia" value={form.firstName} onChange={handleFieldChange} />
                <InputField label="Last Name" name="lastName" required placeholder="Candra" value={form.lastName} onChange={handleFieldChange} />
                <InputField label="Email Address" name="email" type="email" required placeholder="pristia@gmail.com" value={form.email} onChange={handleFieldChange} />
                
                {/* Custom Date Picker look-alike for Join Date */}
                <InputField label="Join Date" name="dateOfJoining" type="date" required value={form.dateOfJoining} onChange={handleFieldChange} />

                {/* Other Required Backend Fields (kept simple) */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <InputField label="Employee ID" name="employeeId" required placeholder="EMP0004" value={form.employeeId} onChange={handleFieldChange} />
                  <div style={{ position: "relative" }}>
                    <InputField label={editMode ? "Password (leave blank to keep)" : "Password"} name="password" type={showPassword ? "text" : "password"} required={!editMode} placeholder="Min 8 characters" value={form.password} onChange={handleFieldChange} />
                    <span onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "38px", cursor: "pointer", color: 'var(--text-secondary)', fontSize: "16px" }}>
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <InputField label="Department" name="department" placeholder="Designer" value={form.department} onChange={handleFieldChange} />
                    <InputField label="Job Title" name="designation" placeholder="3D Designer" value={form.designation} onChange={handleFieldChange} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                      Role <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      style={{ width: '100%', padding: '12px 14px', border: '2px solid var(--border-color)', borderRadius: '12px', fontSize: '13px', fontWeight: '600', outline: 'none', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="HR">HR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', background: 'var(--panel-bg)' }}>
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" form="employeeForm" disabled={submitting}
                className="flex-1 py-3.5 bg-[#0f172a] text-white rounded-2xl text-[14px] font-bold hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-70">
                {submitting ? '⏳...' : editMode ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--panel-bg)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#fef2f2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px' }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Delete Employee
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong className="text-slate-800 dark:text-white">{showDeleteConfirm.firstName} {showDeleteConfirm.lastName}</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-white border-2 border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm.id)} disabled={deleting === showDeleteConfirm.id} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-[13px] font-bold hover:bg-red-700 transition-colors shadow-lg disabled:opacity-70">
                {deleting === showDeleteConfirm.id ? '⏳...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
