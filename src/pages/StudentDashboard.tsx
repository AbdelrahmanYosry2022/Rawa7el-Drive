import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Home, 
  Calendar, 
  ClipboardList, 
  BookOpen, 
  GraduationCap, 
  LogOut, 
  Menu, 
  X, 
  Sparkles,
  Loader2,
  Bell,
  User as UserIcon,
  LayoutGrid
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Sidebar Component
const Sidebar = ({ isOpen, toggle }: { isOpen: boolean, toggle: () => void }) => {
  const menuItems = [
    { icon: Home, label: 'الرئيسية', href: '/student/dashboard' },
    { icon: Calendar, label: 'تقويم الحضور', href: '/student/calendar' },
    { icon: ClipboardList, label: 'سجل الحضور والغياب', href: '/student/attendance' },
    { icon: BookOpen, label: 'المواد العلمية', href: '/student/materials' },
    { icon: GraduationCap, label: 'الاختبارات', href: '/student/exams' },
  ];

  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 w-72 bg-white border-l border-slate-100 z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 shadow-2xl md:shadow-none`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-800 tracking-tight">بداية الإنطلاق</span>
            </div>
            <button onClick={toggle} className="md:hidden p-2 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300
                  ${isActive 
                    ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
                `}
                onClick={() => window.innerWidth < 768 && toggle()}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm md:text-base">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-2">
            <button 
              onClick={() => navigate('/student')}
              className="flex items-center w-full gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-all duration-300 font-medium border border-transparent hover:border-emerald-100 shadow-sm bg-white"
            >
              <LayoutGrid className="w-5 h-5" />
              <span>البرامج والمنصات</span>
            </button>

            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="flex items-center w-full gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300 font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// Main Dashboard Home for Student
const StudentHome = ({ user }: { user: UserData | null }) => (
  <div className="p-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'ساعات الحضور', value: '0', icon: Calendar, color: 'emerald' },
        { label: 'المواد المنجزة', value: '0', icon: BookOpen, color: 'blue' },
        { label: 'الاختبارات القادمة', value: '0', icon: GraduationCap, color: 'purple' },
        { label: 'التقييم العام', value: '-', icon: Sparkles, color: 'amber' },
      ].map((stat, idx) => (
        <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 leading-none mb-1">{stat.value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

import StudentCalendarPage from './student/StudentCalendarPage';
import StudentAttendancePage from './student/StudentAttendancePage';
import StudentMaterialsPage from './student/StudentMaterialsPage';
import StudentExamsPage from './student/StudentExamsPage';

// Generic Placeholder for pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm text-center">
      <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
        <Sparkles className="w-12 h-12 text-emerald-600" />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">{title}</h2>
      <p className="text-slate-500 font-medium text-lg">هذه الصفحة قيد التطوير حالياً لتقديم تجربة تعليمية استثنائية!</p>
    </div>
  </div>
);

export default function StudentDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('User')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        if (userData.role !== 'STUDENT') {
          navigate('/dashboard');
          return;
        }
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="md:pr-72 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 flex items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 bg-slate-50 rounded-xl text-slate-600 md:hidden hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-black text-slate-800 tracking-tight hidden md:block">
              أهلاً بك يا {user?.name?.split(' ')[0]} 👋
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all hover:shadow-inner">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 pr-4 border-r border-slate-100">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-black text-slate-800 leading-none mb-1.5 text-right tracking-tight">{user?.name}</p>
                <div className="flex justify-end">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest">طالب</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden shadow-sm">
                <UserIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentHome user={user} />} />
            <Route path="calendar" element={<StudentCalendarPage />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="materials" element={<StudentMaterialsPage />} />
            <Route path="exams" element={<StudentExamsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
