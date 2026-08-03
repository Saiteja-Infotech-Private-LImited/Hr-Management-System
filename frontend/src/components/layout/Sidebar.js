'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import toast from 'react-hot-toast';
import { LayoutGrid, Users, Calendar, ClipboardList, DollarSign, TrendingUp, Briefcase, UserPlus, Bell, Settings, LogOut, ChevronDown, HelpCircle, Sun, Moon, ChevronsLeft, CheckSquare } from 'lucide-react';

const EMP_MENU = [
  { key: '/employee/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { key: '/employee/attendance', label: 'Attendance', icon: Calendar },
  { key: '/employee/leave', label: 'Time Off', icon: ClipboardList },
  { key: '/employee/payslips', label: 'Payroll', icon: DollarSign },
  { key: '/employee/performance', label: 'Performance', icon: TrendingUp },
  { key: '/employee/onboarding', label: 'Onboarding', icon: UserPlus },
  { key: '/employee/notifications', label: 'Notifications', icon: Bell },
];

const ADMIN_MENU = [
  { key: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { key: '/admin/employees', label: 'Employees', icon: Users, children: [
    { key: '/admin/employees', label: 'Manage Employees' },
    { key: '/admin/directory', label: 'Directory' },
    { key: '/admin/org-chart', label: 'ORG Chart' }
  ]},
  { key: '/admin/onboarding/checklist', label: 'Checklist', icon: CheckSquare },
  { key: '/admin/leave', label: 'Time Off', icon: ClipboardList },
  { key: '/admin/attendance', label: 'Attendance', icon: Calendar },
  { key: '/admin/payroll', label: 'Payroll', icon: DollarSign },
  { key: '/admin/performance', label: 'Performance', icon: TrendingUp },
  { key: '/admin/recruitment', label: 'Recruitment', icon: Briefcase },
  { key: '/admin/onboarding', label: 'Onboarding', icon: UserPlus },
];

export default function Sidebar({ role }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync collapse state with body class
  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  // Sync with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener('toggleMobileSidebar', handleToggle);
    return () => window.removeEventListener('toggleMobileSidebar', handleToggle);
  }, []);

  const menu = role === 'ADMIN' || role === 'HR' ? ADMIN_MENU : EMP_MENU;
  const settingsRoute = role === 'ADMIN' || role === 'HR'
    ? '/admin/settings'
    : '/employee/settings';

  const handleLogout = () => {
    dispatch(logout());
    router.push('/');
  };

  const isItemActive = (key) => {
    if (pathname === key) return true;
    
    const allKeys = [...menu.map(m => m.key), settingsRoute];
    const bestMatch = allKeys.reduce((best, k) => {
      if (pathname === k || pathname.startsWith(k + '/')) {
        if (!best || k.length > best.length) {
          return k;
        }
      }
      return best;
    }, null);

    return key === bestMatch;
  };

  const getNavItemClass = (key, hasChildren = false) => {
    const active = isItemActive(key);
    return `flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isCollapsed ? 'px-[0px]' : 'px-[16px]'} py-[12px] rounded-[10px] cursor-pointer mb-[4px] text-[13.5px] transition-all ${
      active
        ? 'bg-[#10b981] text-white font-bold shadow-lg shadow-emerald-500/20'
        : 'bg-transparent text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
    }`;
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <div className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''} border-r border-slate-100 dark:border-transparent`}>
        {/* Logo */}
        <div className={`pt-6 pb-6 ${isCollapsed ? 'px-0 justify-center flex-col gap-4' : 'px-6 justify-between'} flex items-center`}>
          <div className="flex items-center gap-2.5">
            <div className="w-[28px] h-[28px] rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/20 shrink-0">
              <span className="text-white font-extrabold text-[15px] leading-none">H</span>
            </div>
            {!isCollapsed && (
              <div className="text-slate-900 dark:text-white font-bold text-[16px] whitespace-nowrap">
                {role === 'ADMIN' || role === 'HR' ? 'HRMS Admin' : 'HRMS Employee'}
              </div>
            )}
          </div>
          <ChevronsLeft 
            className={`w-5 h-5 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-all ${isCollapsed ? 'rotate-180' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        {/* Main Menu */}
        <div className="flex-1 px-4 py-2 overflow-y-auto mt-2 space-y-1">
          {menu.map((item) => {
            const active = isItemActive(item.key);
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            
            return (
              <div key={item.key}>
                <div
                  onClick={() => {
                    setIsMobileOpen(false);
                    router.push(item.key);
                  }}
                  className={getNavItemClass(item.key, hasChildren)}
                >
                  {active && !hasChildren ? (
                    <>
                      {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                      <Icon className="w-[18px] h-[18px] opacity-90 shrink-0" strokeWidth={2.5} />
                    </>
                  ) : (
                    <>
                      <div className={`flex items-center gap-3 ${active && hasChildren ? 'text-white font-bold' : ''}`}>
                        <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
                        {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                      </div>
                      {hasChildren && !isCollapsed && (
                        <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${active && hasChildren ? 'rotate-180 text-white opacity-90' : 'opacity-40'}`} />
                      )}
                    </>
                  )}
                </div>

                {hasChildren && active && !isCollapsed && (
                  <div className="mt-1 mb-2 ml-[34px] flex flex-col gap-1 border-l-2 border-slate-100 dark:border-slate-800">
                    {item.children.map(child => {
                      const childActive = pathname === child.key;
                      return (
                        <div
                          key={child.label}
                          onClick={() => { setIsMobileOpen(false); router.push(child.key); }}
                          className={`pl-4 py-2 text-[13px] rounded-r-[8px] cursor-pointer transition-colors ${
                            childActive 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500 -ml-[2px]' 
                              : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {child.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className={`px-4 pb-6 pt-4 space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
          {/* Help Center */}
          <div 
            onClick={() => toast.success('Help Center coming soon!')}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} ${isCollapsed ? 'px-[0px]' : 'px-[16px]'} py-[12px] rounded-[10px] cursor-pointer mb-[4px] text-[13.5px] transition-all bg-transparent text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200`}
          >
            <div className="flex items-center gap-3 relative">
              <HelpCircle className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
              {!isCollapsed && <span>Help Center</span>}
              {isCollapsed && (
                <div className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center">8</div>
              )}
            </div>
            {!isCollapsed && (
              <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">8</div>
            )}
          </div>

          {/* Setting */}
          <div
            onClick={() => { setIsMobileOpen(false); router.push(settingsRoute); }}
            className={getNavItemClass(settingsRoute)}
          >
            {isItemActive(settingsRoute) ? (
              <>
                {!isCollapsed && <span>Setting</span>}
                <Settings className="w-[18px] h-[18px] opacity-90 shrink-0" strokeWidth={2.5} />
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Settings className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
                {!isCollapsed && <span>Setting</span>}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <div className={`mt-4 mx-2 bg-slate-100 dark:bg-[#141A29] rounded-xl p-1 flex ${isCollapsed ? 'flex-col mx-0' : 'items-center rounded-full'} shadow-inner`}>
            <div 
              className={`flex-1 flex items-center justify-center gap-2 py-2 ${isCollapsed ? 'rounded-lg mb-1' : 'rounded-full'} text-[11px] font-semibold cursor-pointer transition-all ${theme === 'light' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              onClick={() => handleThemeChange('light')}
            >
              <Sun className="w-3.5 h-3.5 shrink-0" /> {!isCollapsed && 'Light'}
            </div>
            <div 
              className={`flex-1 flex items-center justify-center gap-2 py-2 ${isCollapsed ? 'rounded-lg' : 'rounded-full'} text-[11px] font-semibold cursor-pointer transition-all ${theme === 'dark' ? 'bg-[#1E273A] text-white shadow-sm' : 'text-slate-500'}`}
              onClick={() => handleThemeChange('dark')}
            >
              <Moon className="w-3.5 h-3.5 shrink-0" /> {!isCollapsed && 'Dark'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
