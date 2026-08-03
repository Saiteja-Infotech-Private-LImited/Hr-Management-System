'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { getAllEmployees } from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { Users, Briefcase, UserPlus, Calendar, Search, Bell, Moon, Settings, MoreVertical, ChevronDown, CheckCircle, Clock, Star, Filter, Eye, Edit2, Trash2, FileText } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function StatCard({ icon, iconBg, value, label, trend, isPositive }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (e.target.closest('.action-menu-btn')) return;
      setMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-colors">
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{value}</div>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="action-menu-btn p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-10 w-36 bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden text-left flex flex-col py-1">
            <button
              onClick={() => toast.success('View Details coming soon!')}
              className="w-full px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" /> View Details
            </button>
            <button
              onClick={() => toast.success('Download Report coming soon!')}
              className="w-full px-4 py-2 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4" /> Download
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-[11px] font-bold mt-2">
        <span className={isPositive ? 'text-emerald-600 dark:text-[#DBFF00]' : 'text-orange-500 dark:text-[#f97316]'}>
          {isPositive ? '↑' : '↓'} {trend}
        </span>
        <span className="text-slate-500 font-medium ml-1">from last month</span>
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-2"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-64 mb-8"></div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useSelector(s => s.auth);
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('.action-menu-btn')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const empRes = await getAllEmployees(0, 50);
        if (empRes.data?.data?.content) {
          setEmployees(empRes.data.data.content);
          setTotalEmployees(empRes.data.data.totalElements || empRes.data.data.content.length);
        } else if (empRes.data) {
          setEmployees(empRes.data);
          setTotalEmployees(empRes.data.length);
        }
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchAll();
  }, []);

  // Generate dynamic chart data ending at the actual total
  const chartData = [...Array(7)].map((_, i) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let mIndex = new Date().getMonth() - (6 - i);
    if (mIndex < 0) mIndex += 12;
    const fakeVal = Math.max(0, totalEmployees - ((6 - i) * 12));
    return { name: months[mIndex], employees: i === 6 ? totalEmployees : fakeVal };
  });

  const filteredEmployees = employees.filter(emp => {
    const name = emp.name || emp.firstName || '';
    const email = emp.email || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const status = emp.status || 'Active'; // default mock

    if (activeTab === 'Active' && status !== 'Active') return false;
    if (activeTab === 'Inactive' && status !== 'Inactive') return false;

    return matchesSearch;
  });

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2">
            Welcome back, {user?.name?.split(' ')[0] || 'System'}! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
            Here's what's happening with your organization today.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/5 rounded-full text-[13px] focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-[#DBFF00] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
            />
          </div>
          <div
            onClick={() => router.push('/admin/notifications')}
            className="relative cursor-pointer p-2 rounded-full bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/5 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#151D2A]"></span>
          </div>
          <div
            onClick={() => {
              const isDark = document.documentElement.classList.contains('dark');
              if (isDark) document.documentElement.classList.remove('dark');
              else document.documentElement.classList.add('dark');
            }}
            className="cursor-pointer p-2 rounded-full bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/5 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div
            onClick={() => router.push('/admin/settings')}
            className="cursor-pointer p-2 rounded-full bg-slate-900 dark:bg-[#DBFF00] text-white dark:text-[#151D2A] shadow-sm hover:opacity-90 transition-opacity"
          >
            <Settings className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          icon={<Users className="w-6 h-6 text-emerald-900 dark:text-[#151D2A]" />}
          iconBg="bg-emerald-100 dark:bg-[#DBFF00]"
          value={totalEmployees || '0'}
          label="Total Employees"
          trend="12.5%"
          isPositive={true}
        />
        <StatCard
          icon={<Briefcase className="w-6 h-6 text-purple-900 dark:text-[#151D2A]" />}
          iconBg="bg-purple-100 dark:bg-[#D4A5FF]"
          value="24"
          label="Departments"
          trend="8.2%"
          isPositive={true}
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-blue-900 dark:text-[#151D2A]" />}
          iconBg="bg-blue-100 dark:bg-[#A5DEFF]"
          value="95.4%"
          label="Attendance"
          trend="4.3%"
          isPositive={true}
        />
        <StatCard
          icon={<UserPlus className="w-6 h-6 text-orange-900 dark:text-[#151D2A]" />}
          iconBg="bg-orange-100 dark:bg-[#FFD4A5]"
          value="18"
          label="Open Positions"
          trend="6.7%"
          isPositive={true}
        />
      </div>

      {/* Middle Section: Chart + Activities + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Employee Overview Chart */}
        <div className="col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 min-w-[50%] lg:min-w-0 bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/5 rounded-2xl p-6 relative flex-grow shadow-sm transition-colors" style={{ flexBasis: '50%' }}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Employee Overview</h3>
            <button className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2">
              This Month <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="h-[220px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', fontWeight: 'bold', padding: '8px 12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#10b981', fontWeight: '900', fontSize: '14px' }}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line
                  type="monotone"
                  dataKey="employees"
                  name="Employees"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#DBFF00' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="col-span-1 bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-6">Recent Activities</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-slate-800 dark:text-white font-medium">New employee <span className="text-emerald-600 dark:text-emerald-400">John Smith</span></div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">joined the company</div>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 shrink-0">10:30 AM</div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 flex items-center justify-center shrink-0 mt-1">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-slate-800 dark:text-white font-medium">Department meeting</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">scheduled for tomorrow</div>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 shrink-0">09:15 AM</div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-slate-800 dark:text-white font-medium">Payroll processed</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">successfully</div>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 shrink-0">Yesterday</div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-yellow-500/10 border border-orange-200 dark:border-yellow-500/20 flex items-center justify-center shrink-0 mt-1">
                <Star className="w-4 h-4 text-orange-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-slate-800 dark:text-white font-medium">Performance review</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">cycle completed</div>
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 shrink-0">2 days ago</div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="col-span-1 bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Upcoming Events</h3>
            <span
              onClick={() => toast.success('Events Calendar coming soon!')}
              className="text-[12px] text-emerald-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-white cursor-pointer transition-colors font-medium"
            >
              View All
            </span>
          </div>
          <div className="space-y-5">

            <div className="flex gap-4 items-center">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 flex flex-col items-center justify-center min-w-[60px]">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">May</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">24</span>
              </div>
              <div>
                <div className="text-[13px] font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400"></span> Department Meeting
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> 10:00 AM - 11:00 AM
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 flex flex-col items-center justify-center min-w-[60px]">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">May</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">28</span>
              </div>
              <div>
                <div className="text-[13px] font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-yellow-400"></span> Payroll Processing
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> 09:00 AM - 10:00 AM
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl p-3 flex flex-col items-center justify-center min-w-[60px]">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">May</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">31</span>
              </div>
              <div>
                <div className="text-[13px] font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></span> Performance Review
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> 02:00 PM - 04:00 PM
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* All Employees Table */}
      <div className="bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">All Employees</h3>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-lg text-[13px] focus:outline-none focus:border-emerald-500 dark:focus:border-slate-500 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
              />
            </div>
            <button
              onClick={() => toast.success('Filter dialog coming soon!')}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 dark:border-white/5 mb-4">
          <button
            onClick={() => setActiveTab('All')}
            className={`px-2 py-3 text-[13px] font-semibold transition-colors ${activeTab === 'All' ? 'text-emerald-600 dark:text-[#DBFF00] border-b-2 border-emerald-600 dark:border-[#DBFF00]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >All</button>
          <button
            onClick={() => setActiveTab('Active')}
            className={`px-2 py-3 text-[13px] font-semibold transition-colors ${activeTab === 'Active' ? 'text-emerald-600 dark:text-[#DBFF00] border-b-2 border-emerald-600 dark:border-[#DBFF00]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >Active</button>
          <button
            onClick={() => setActiveTab('Inactive')}
            className={`px-2 py-3 text-[13px] font-semibold transition-colors ${activeTab === 'Inactive' ? 'text-emerald-600 dark:text-[#DBFF00] border-b-2 border-emerald-600 dark:border-[#DBFF00]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >Inactive</button>
        </div>

        <div className="overflow-x-visible overflow-y-visible min-h-[300px] pb-32">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/5">
                <th className="py-3 px-4 font-semibold text-[11px] text-slate-500 dark:text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-4 font-semibold text-[11px] text-slate-500 dark:text-slate-500 uppercase tracking-wider">Department</th>
                <th className="py-3 px-4 font-semibold text-[11px] text-slate-500 dark:text-slate-500 uppercase tracking-wider">Position</th>
                <th className="py-3 px-4 font-semibold text-[11px] text-slate-500 dark:text-slate-500 uppercase tracking-wider">Join Date</th>
                <th className="py-3 px-4 font-semibold text-[11px] text-slate-500 dark:text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold text-[11px] text-slate-500 dark:text-slate-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? filteredEmployees.map((emp, i) => {
                const uniqueId = emp.id || `emp_${i}`;
                return (
                  <tr key={uniqueId} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-sm">
                          {emp?.name?.substring(0, 2).toUpperCase() || emp?.firstName?.substring(0, 2).toUpperCase() || 'UN'}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-800 dark:text-white">{emp.name || emp.firstName || 'Daniel Carter'}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{emp.email || 'user@hrms.com'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-[#10b981]/10 text-emerald-700 dark:text-[#10b981] border border-emerald-200 dark:border-[#10b981]/20">
                        {emp.department || 'Engineering'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[13px] font-medium text-slate-600 dark:text-slate-300">{emp.position || emp.designation || 'Staff'}</td>
                    <td className="py-4 px-4 text-[13px] font-medium text-slate-500 dark:text-slate-400">{emp.joinDate || 'Jan 15, 2025'}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${(emp.status || 'Active') === 'Active' ? 'border-emerald-200 dark:border-[#DBFF00]/50 text-emerald-600 dark:text-[#DBFF00] bg-emerald-50 dark:bg-[#DBFF00]/10' : 'border-slate-200 dark:border-slate-500/50 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-500/10'}`}>
                        {emp.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === uniqueId ? null : uniqueId); }}
                        className="action-menu-btn p-2 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-500 dark:hover:text-[#DBFF00] dark:hover:bg-[#DBFF00]/10 transition-colors"
                        title="More Options"
                      >
                        <MoreVertical className="w-5 h-5 mx-auto" />
                      </button>
                      {openMenuId === uniqueId && (
                        <div className="absolute right-8 top-10 w-40 bg-white dark:bg-[#1A2033] border border-slate-200 dark:border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden text-left flex flex-col py-1">
                          <button
                            onClick={() => router.push(`/admin/employees/detail?id=${uniqueId}`)}
                            className="w-full px-4 py-2.5 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                          >
                            <Eye className="w-4 h-4" /> View Details
                          </button>
                          <button
                            onClick={() => toast.success('Edit feature coming soon!')}
                            className="w-full px-4 py-2.5 text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" /> Edit Profile
                          </button>
                          <div className="h-[1px] w-full bg-slate-100 dark:bg-white/5 my-1"></div>
                          <button
                            onClick={() => toast.error('Delete feature coming soon!')}
                            className="w-full px-4 py-2.5 text-[13px] font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[13px] text-slate-500 font-medium">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
