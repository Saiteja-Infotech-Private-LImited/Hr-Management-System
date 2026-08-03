'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getEmployeeById } from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { Mail, Phone, Globe, ChevronDown, Pen, Plus, Trash2, FileText, UploadCloud, Link as LinkIcon } from 'lucide-react';

function DetailEmployeeContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('General');
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getEmployeeById(id);
        setEmployee(res.data?.data || res.data);
      } catch (err) {
        toast.error('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return <div className="py-20 text-center text-slate-500 font-bold text-sm">Loading...</div>;
  if (!employee) return <div className="py-20 text-center text-slate-500 font-bold text-sm">Employee not found</div>;

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="text-[24px] font-extrabold text-slate-900 dark:text-white">
          Detail Employee
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar Profile Summary */}
        <div className="w-full lg:w-[320px] shrink-0 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col h-fit">
          {/* Avatar & Name */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-slate-100">
              <img src={`https://i.pravatar.cc/150?u=${employee.id}`} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
            </div>
            <h2 className="text-[20px] font-extrabold text-slate-900 dark:text-white mb-1">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-[13px] font-medium text-slate-500 mb-3">{employee.designation || 'Designer'}</p>
            <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-4 py-1.5 rounded-full flex items-center gap-1.5 tracking-wider">
              {employee.active ? 'ACTIVE' : 'INACTIVE'} <ChevronDown size={12} strokeWidth={3} />
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700/50 mb-6" />

          {/* Contact Info */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-3 text-[13px] font-medium text-slate-700 dark:text-slate-300">
              <Mail size={16} className="text-slate-400" />
              <span className="truncate">{employee.email}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] font-medium text-slate-700 dark:text-slate-300">
              <Phone size={16} className="text-slate-400" />
              <span>{employee.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] font-medium text-slate-700 dark:text-slate-300">
              <Globe size={16} className="text-slate-400" />
              <span>GMT +07:00</span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700/50 mb-6" />

          {/* Org Info */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex justify-between items-center group cursor-pointer">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Departement</p>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white">{employee.department || 'Designer'}</p>
              </div>
              <ChevronDown size={14} className="text-slate-300 -rotate-90 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="flex justify-between items-center group cursor-pointer">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-0.5">Office</p>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white">Unpixel Studio</p>
              </div>
              <ChevronDown size={14} className="text-slate-300 -rotate-90 group-hover:text-slate-600 transition-colors" />
            </div>
            <div className="flex justify-between items-center group cursor-pointer">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-1">Line Manager</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200"></div>
                  <p className="text-[13px] font-bold text-slate-900 dark:text-white">Skylar Calzoni</p>
                </div>
              </div>
              <ChevronDown size={14} className="text-slate-300 -rotate-90 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full py-3.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 transition-colors shadow-lg">
            Action <ChevronDown size={16} />
          </button>
        </div>

        {/* Right Main Panel */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
          {/* Tabs */}
          <div className="flex gap-8 border-b-2 border-slate-50 dark:border-slate-700/50 mb-8 px-2">
            {['General', 'Job', 'Payroll', 'Documents', 'Setting'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-[14px] font-bold transition-all relative ${
                  activeTab === tab ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-[var(--primary-color)] rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="px-2">
            {activeTab === 'General' && (
              <GeneralTab employee={employee} isEditing={isEditingGeneral} setIsEditing={setIsEditingGeneral} />
            )}
            {activeTab === 'Job' && (
              <JobTab employee={employee} />
            )}
            {activeTab === 'Payroll' && <PayrollTab employee={employee} />}
            {activeTab === 'Documents' && <DocumentsTab employee={employee} />}
            {activeTab === 'Setting' && <SettingTab employee={employee} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralTab({ employee, isEditing, setIsEditing }) {
  const [form, setForm] = useState({
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    dateOfBirth: employee.dateOfBirth || '',
    nationality: 'Indonesia',
    email: employee.email || '',
    healthInsurance: 'Axa Insurance',
    gender: 'Female',
    maritalStatus: '-',
    taxId: '-',
    socialInsurance: '-',
    phone: employee.phone || '',
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Personal Info Card */}
      <div className="border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-8 relative">
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-6 right-6 w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-slate-200 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <Pen size={14} />
        </button>
        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Personal Info</h3>
        
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <InputGroup label="Full Name *" name="firstName" value={form.firstName + ' ' + form.lastName} />
            <InputGroup label="Gender *" name="gender" value={form.gender} isSelect />
            <InputGroup label="Date of Birth *" name="dateOfBirth" value={form.dateOfBirth} type="date" />
            <InputGroup label="Email Address *" name="email" value={form.email} />
            <InputGroup label="Phone Number *" name="phone" value={form.phone} />
            <InputGroup label="Nationality *" name="nationality" value={form.nationality} isSelect />
            <InputGroup label="Health Care *" name="healthInsurance" value={form.healthInsurance} />
            <InputGroup label="Marital Status *" name="maritalStatus" value={form.maritalStatus} />
            <InputGroup label="Personal Tax ID *" name="taxId" value={form.taxId} />
            <InputGroup label="Social Insurance *" name="socialInsurance" value={form.socialInsurance} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <InfoRow label="Full Name" value={`${form.firstName} ${form.lastName} Nelson`} />
            <InfoRow label="Gender" value={form.gender} />
            <InfoRow label="Date of Birth" value={form.dateOfBirth || '23 May 1997'} />
            <InfoRow label="Marital Status" value={form.maritalStatus} />
            <InfoRow label="Nationality" value={form.nationality} />
            <InfoRow label="Personal Tax ID" value={form.taxId} />
            <InfoRow label="Email Address" value={form.email} />
            <InfoRow label="Social Insurance" value={form.socialInsurance} />
            <InfoRow label="Health Insurance" value={form.healthInsurance} />
            <InfoRow label="Phone Number" value={form.phone || '089318298493'} />
          </div>
        )}
      </div>

      {/* Address Card */}
      <div className="border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-8 relative">
        <button className="absolute top-6 right-6 w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
          <Pen size={14} />
        </button>
        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Address</h3>
        <div className="grid grid-cols-1 gap-y-6">
          <InfoRow label="Primary addresss" value="Banyumanik Street, Central Java. Semarang Indonesia" />
          <InfoRow label="Country" value="Indonesia" />
          <InfoRow label="State/Province" value="Central Java" />
          <InfoRow label="City" value="Semarang" />
          <InfoRow label="Post Code" value="03125" />
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className="border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-8 relative">
        <button className="absolute top-6 right-6 w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
          <Pen size={14} />
        </button>
        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <InfoRow label="Full Name" value="Albert Jhonson" />
          <InfoRow label="Phone Number" value="089870140011" />
        </div>
      </div>
    </div>
  );
}

function JobTab({ employee }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-8 relative">
        <button className="absolute top-6 right-6 w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-slate-200 transition-colors">
          <Pen size={14} />
        </button>
        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Employment Information</h3>
        <div className="grid grid-cols-1 gap-y-6">
          <InfoRow label="Employee ID" value={employee.employeeId || 'UN1203'} />
          <InfoRow label="Service Year" value="3 Years 7 Months" />
          <InfoRow label="Join Date" value={employee.dateOfJoining || '20 Aug 2019'} />
        </div>
      </div>

      <div className="border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-8 relative">
        <button className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
          <Plus size={20} />
        </button>
        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Job Timeline</h3>
        
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-5 gap-4 py-3 border-b-2 border-slate-50 dark:border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <div>Effective Date</div>
              <div>Job Title</div>
              <div>Position Type</div>
              <div>Employment Type</div>
              <div>Line Manager</div>
            </div>
            <div className="grid grid-cols-5 gap-4 py-4 text-[13px] font-bold text-slate-700 dark:text-slate-300 items-center">
              <div>20 Aug 2019</div>
              <div>UI UX Designer</div>
              <div>-</div>
              <div>Fulltime</div>
              <div>@skylar</div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-8 relative">
        <button className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
          <Plus size={20} />
        </button>
        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Contract Timeline</h3>
        
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-5 gap-4 py-3 border-b-2 border-slate-50 dark:border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <div>Contract Number</div>
              <div>Contract Name</div>
              <div>Contract Type</div>
              <div>Start Date</div>
              <div>End Date</div>
            </div>
            <div className="grid grid-cols-5 gap-4 py-4 text-[13px] font-bold text-slate-700 dark:text-slate-300 items-center">
              <div>#12345</div>
              <div>Fulltime Remote</div>
              <div>Fulltime Remote</div>
              <div>20 Aug 2019</div>
              <div>-</div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-8 relative">
        <button className="absolute top-6 right-6 w-8 h-8 rounded-full border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:border-slate-200 transition-colors">
          <Pen size={14} />
        </button>
        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Work Schedule</h3>
        <div className="py-2 text-[13px] font-bold text-slate-700 dark:text-slate-300">
          Standard Work Hours (Mon - Fri)
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center">
      <span className="text-[13px] font-semibold text-slate-400">{label}</span>
      <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{value}</span>
    </div>
  );
}

function InputGroup({ label, name, value, type = "text", isSelect = false }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px] font-bold text-slate-900 dark:text-white ml-1">
        {label}
      </label>
      <div className="relative">
        {isSelect ? (
          <select className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 focus:border-[var(--primary-color)] transition-colors appearance-none cursor-pointer">
            <option>{value}</option>
          </select>
        ) : (
          <input
            type={type}
            name={name}
            defaultValue={value}
            placeholder="Input here"
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 focus:border-[var(--primary-color)] transition-colors"
          />
        )}
        {isSelect && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
      </div>
    </div>
  );
}

function PayrollTab({ employee }) {
  return (
    <div className="flex flex-col gap-8">
      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-50 dark:border-slate-700/50">
        <InfoRow label="Employee Status" value={employee.active ? 'Active' : 'Inactive'} />
        <InfoRow label="Job Title" value={employee.designation || 'Junior UI/UX Designer'} />
        <InfoRow label="Employment Type" value="Contractor" />
        <InfoRow label="Job Date" value={employee.dateOfJoining || '16 Feb 2020'} />
        <InfoRow label="Geofencing" value="30 Sep 2024" />
        <InfoRow label="Last Working Date" value="-" />
      </div>

      <div className="flex flex-col gap-4">
        {/* Total Compensation */}
        <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Total Compensation</span>
          <span className="text-[16px] font-extrabold text-slate-900 dark:text-white">$ 3,729.00</span>
        </div>

        {/* Salary */}
        <div className="flex items-center justify-between p-6 border-2 border-slate-50 dark:border-slate-700/50 rounded-2xl cursor-pointer hover:border-slate-100 dark:hover:border-slate-600 transition-colors">
          <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Salary</span>
          <ChevronDown size={18} className="text-slate-400" />
        </div>

        {/* Recurring */}
        <div className="flex items-center justify-between p-6 border-2 border-slate-50 dark:border-slate-700/50 rounded-2xl cursor-pointer hover:border-slate-100 dark:hover:border-slate-600 transition-colors">
          <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Recurring</span>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-[14px] font-bold text-slate-900 dark:text-white">$ 0</span>
            <ChevronDown size={18} />
          </div>
        </div>

        {/* One-off */}
        <div className="flex items-center justify-between p-6 border-2 border-slate-50 dark:border-slate-700/50 rounded-2xl cursor-pointer hover:border-slate-100 dark:hover:border-slate-600 transition-colors">
          <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300">One-off</span>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-[14px] font-bold text-slate-900 dark:text-white">$ 0</span>
            <ChevronDown size={18} />
          </div>
        </div>
        
        {/* Offset */}
        <div className="flex items-center justify-between p-6 border-2 border-slate-50 dark:border-slate-700/50 rounded-2xl cursor-pointer hover:border-slate-100 dark:hover:border-slate-600 transition-colors">
          <span className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Offset</span>
          <ChevronDown size={18} className="text-slate-400" />
        </div>
      </div>
    </div>
  );
}

function DocumentsTab() {
  return (
    <div className="flex flex-col gap-8">
      {/* Personal Documents */}
      <div>
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">Personal Documents</h3>
          <button className="text-slate-400 hover:text-slate-600 transition-colors"><Plus size={20} /></button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-6">
          <div className="grid grid-cols-[1fr_80px] gap-4 py-3 border-b-2 border-slate-50 dark:border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Document Name</div>
            <div className="text-right">Action</div>
          </div>
          
          {/* File Row */}
          <div className="grid grid-cols-[1fr_80px] gap-4 py-4 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">CV_lincoln_v1.pdf</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                <LinkIcon size={14} />
              </button>
              <button className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Drag and Drop Area */}
        <div className="mt-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20">
            <UploadCloud size={32} />
          </div>
          <h4 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-2">Drag & Drop here to upload</h4>
          <p className="text-[13px] font-medium text-slate-500 mb-6">Or select file from your computer</p>
          <button className="px-6 py-3 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-[13px] font-bold transition-colors shadow-lg shadow-slate-900/20">
            Upload File
          </button>
        </div>
      </div>

      {/* Payslips */}
      <div>
        <div className="flex justify-between items-center mb-4 px-2 mt-4">
          <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">Payslips</h3>
          <button className="text-slate-400 hover:text-slate-600 transition-colors"><Plus size={20} /></button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-6">
          <div className="grid grid-cols-[1fr_80px] gap-4 py-3 border-b-2 border-slate-50 dark:border-slate-700/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Document Name</div>
            <div className="text-right">Action</div>
          </div>
          
          {/* File Row */}
          <div className="grid grid-cols-[1fr_80px] gap-4 py-4 items-center border-b border-slate-50 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Payslips_20 Aug.pdf</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                <LinkIcon size={14} />
              </button>
              <button className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_80px] gap-4 py-4 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Payslips_20 Oct.pdf</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                <LinkIcon size={14} />
              </button>
              <button className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-8 relative bg-white dark:bg-slate-800">
        <button className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors">
          <Pen size={16} />
        </button>
        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Account Settings</h3>
        <div className="grid grid-cols-[140px_1fr] items-center">
          <span className="text-[13px] font-medium text-slate-400">Timezone</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white">GMT +07:00 Bangkok, Ha Noi, Jakarta</span>
        </div>
      </div>

      <div className="border-2 border-slate-50 dark:border-slate-700/50 rounded-3xl p-8 relative bg-white dark:bg-slate-800">
        <button className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors">
          <Pen size={16} />
        </button>
        <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Privacy</h3>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-400">Who can see your birthday on calendar?</span>
          <div className="relative">
            <select className="pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none hover:border-slate-200 transition-colors appearance-none cursor-pointer min-w-[140px]">
              <option>Everyone</option>
              <option>Only Me</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetailEmployeePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500 font-bold text-sm">Loading Employee...</div>}>
      <DetailEmployeeContent />
    </Suspense>
  );
}
