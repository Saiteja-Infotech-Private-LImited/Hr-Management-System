'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllEmployees } from '@/lib/adminApi';
import toast from 'react-hot-toast';
import { Mail, Phone } from 'lucide-react';

export default function DirectoryPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await getAllEmployees();
      if (res.data?.data) {
        setEmployees(res.data.data.content || res.data.data);
      } else {
        setEmployees(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto p-2">
      <div className="mb-8">
        <h1 className="text-[24px] font-extrabold text-slate-900 dark:text-white">Directory</h1>
        <p className="text-[13px] font-medium text-slate-500 mt-1">This is director board</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold text-[14px]">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.map((emp) => (
            <div 
              key={emp.id} 
              onClick={() => router.push(`/admin/employees/detail?id=${emp.id}`)}
              className="bg-white dark:bg-slate-800 rounded-[24px] p-8 flex flex-col items-center border-2 border-slate-50 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none transition-all cursor-pointer group"
            >
              <div className="w-[84px] h-[84px] rounded-full overflow-hidden mb-5 bg-slate-100 group-hover:scale-105 transition-transform duration-300">
                <img 
                  src={`https://i.pravatar.cc/150?u=${emp.id}`} 
                  alt={emp.firstName}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display='none'; }}
                />
              </div>
              <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-1">
                {emp.firstName} {emp.lastName}
              </h3>
              <p className="text-[13px] font-medium text-slate-400 mb-6">{emp.designation || 'Staff'}</p>
              
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center gap-3 text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/30 p-2.5 rounded-xl">
                  <Mail size={15} className="text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/30 p-2.5 rounded-xl">
                  <Phone size={15} className="text-slate-400" />
                  <span>{emp.phone || '089318298493'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
