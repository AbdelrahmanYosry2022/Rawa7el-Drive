import { useState, useEffect } from 'react';
import { useNavigate, NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  Home, 
  Calendar, 
  ClipboardList, 
  BookOpen, 
  GraduationCap, 
  LogOut, 
  Sparkles,
  Loader2,
  Bell,
  User as UserIcon,
  LayoutGrid,
  ScanLine,
  MoreHorizontal,
  ChevronLeft
} from 'lucide-react';

import StudentCalendarPage from './student/StudentCalendarPage';
import StudentAttendancePage from './student/StudentAttendancePage';
import StudentMaterialsPage from './student/StudentMaterialsPage';
import StudentExamsPage from './student/StudentExamsPage';
import StudentScanPage from './student/StudentScanPage';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ─── Tab items ───
const TAB_ITEMS = [
  { icon: Home, label: 'الرئيسية', href: '/student/dashboard', position: 'right' as const },
  { icon: ClipboardList, label: 'الحضور', href: '/student/attendance', position: 'right' as const },
  // center = QR scan button (handled separately)
  { icon: BookOpen, label: 'المواد', href: '/student/materials', position: 'left' as const },
  { icon: MoreHorizontal, label: 'المزيد', href: '__more__', position: 'left' as const },
];

const MORE_ITEMS = [
  { icon: Calendar, label: 'تقويم الحضور', href: '/student/calendar' },
  { icon: GraduationCap, label: 'الاختبارات', href: '/student/exams' },
  { icon: LayoutGrid, label: 'البرامج والمنصات', href: '/student' },
];

// ─── Desktop Sidebar (hidden on mobile) ───
const DesktopSidebar = () => {
  const navigate = useNavigate();
  const allItems = [
    { icon: Home, label: 'الرئيسية', href: '/student/dashboard' },
    { icon: Calendar, label: 'تقويم الحضور', href: '/student/calendar' },
    { icon: ClipboardList, label: 'سجل الحضور والغياب', href: '/student/attendance' },
    { icon: ScanLine, label: 'تسجيل حضور', href: '/student/scan' },
    { icon: BookOpen, label: 'المواد العلمية', href: '/student/materials' },
    { icon: GraduationCap, label: 'الاختبارات', href: '/student/exams' },
  ];

  return (
    <aside className="hidden md:flex fixed inset-y-0 right-0 w-72 bg-white border-l border-slate-100 z-50 shadow-none">
      <div className="flex flex-col h-full p-6 w-full">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">بداية الإنطلاق</span>
        </div>

        <nav className="flex-1 space-y-2">
          {allItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300
                ${isActive 
                  ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
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
  );
};

// ─── Bottom Tab Bar (mobile only) ───
const BottomTabBar = ({ onMoreClick }: { onMoreClick: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string) => {
    if (href === '/student/dashboard') return location.pathname === '/student/dashboard' || location.pathname === '/student' || location.pathname === '/student/';
    return location.pathname.startsWith(href);
  };

  const isScanActive = location.pathname === '/student/scan';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Safe area background */}
      <div className="bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-end justify-around px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {/* Right side tabs */}
          {TAB_ITEMS.filter(t => t.position === 'right').map((tab) => (
            <NavLink
              key={tab.href}
              to={tab.href}
              className="flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
            >
              <tab.icon className={`w-5 h-5 mb-0.5 transition-colors ${isActive(tab.href) ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className={`text-[10px] font-bold transition-colors ${isActive(tab.href) ? 'text-emerald-600' : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </NavLink>
          ))}

          {/* Center QR Button */}
          <div className="flex flex-col items-center -mt-5">
            <button
              onClick={() => navigate('/student/scan')}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                isScanActive
                  ? 'bg-emerald-600 shadow-emerald-300'
                  : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200 hover:shadow-emerald-300'
              }`}
            >
              <ScanLine className="w-7 h-7 text-white" />
            </button>
            <span className={`text-[10px] font-bold mt-1 ${isScanActive ? 'text-emerald-600' : 'text-slate-400'}`}>حضور</span>
          </div>

          {/* Left side tabs */}
          {TAB_ITEMS.filter(t => t.position === 'left').map((tab) => (
            tab.href === '__more__' ? (
              <button
                key="more"
                onClick={onMoreClick}
                className="flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
              >
                <MoreHorizontal className="w-5 h-5 mb-0.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400">{tab.label}</span>
              </button>
            ) : (
              <NavLink
                key={tab.href}
                to={tab.href}
                className="flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
              >
                <tab.icon className={`w-5 h-5 mb-0.5 transition-colors ${isActive(tab.href) ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-bold transition-colors ${isActive(tab.href) ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </NavLink>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── More Bottom Sheet ───
const MoreSheet = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-5 pb-2">
          <h3 className="text-lg font-black text-slate-800 mb-4 px-1">المزيد</h3>

          <div className="space-y-1">
            {MORE_ITEMS.map((item) => (
              <button
                key={item.href}
                onClick={() => { navigate(item.href); onClose(); }}
                className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 flex-1 text-right">{item.label}</span>
                <ChevronLeft className="w-4 h-4 text-slate-300" />
              </button>
            ))}

            {/* Logout */}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl hover:bg-red-50 active:bg-red-100 transition-colors mt-2 border-t border-slate-100 pt-4"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-bold text-red-500 flex-1 text-right">تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Close button */}
        <div className="px-5 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 rounded-2xl text-slate-600 font-bold text-sm active:bg-slate-200 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Mobile Header ───
const MobileHeader = ({ user }: { user: UserData | null }) => (
  <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800 leading-tight">
            أهلاً {user?.name?.split(' ')[0]} 👋
          </p>
          <p className="text-[10px] font-bold text-slate-400">بداية الإنطلاق</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all">
          <Bell className="w-4.5 h-4.5" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
          <UserIcon className="w-4.5 h-4.5" />
        </div>
      </div>
    </div>
  </header>
);

// ─── Desktop Header ───
const DesktopHeader = ({ user }: { user: UserData | null }) => (
  <header className="hidden md:flex h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 items-center justify-between px-10">
    <h2 className="text-xl font-black text-slate-800 tracking-tight">
      أهلاً بك يا {user?.name?.split(' ')[0]} 👋
    </h2>
    <div className="flex items-center gap-4">
      <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all hover:shadow-inner">
        <Bell className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-4 pr-4 border-r border-slate-100">
        <div className="text-left">
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
);

// ─── Student Home (mobile-first) ───
const StudentHome = ({ user }: { user: UserData | null }) => (
  <div className="px-4 py-5 md:p-8">
    {/* Welcome card - mobile only (desktop has header greeting) */}
    <div className="md:hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 mb-4 text-white">
      <p className="text-white/80 text-xs font-medium">مرحباً بك في</p>
      <h2 className="text-lg font-black">منصة بداية التعليمية</h2>
    </div>

    {/* Check-in Banner */}
    <NavLink to="/student/scan" className="block mb-5">
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl md:rounded-3xl p-4 md:p-5 flex items-center justify-between text-white shadow-lg hover:shadow-xl transition-all cursor-pointer group">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ScanLine className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg">سجّل حضورك الآن</h3>
            <p className="text-white/80 text-[11px] md:text-xs">امسح QR Code أو أدخل الكود الرقمي</p>
          </div>
        </div>
        <ChevronLeft className="w-5 h-5 text-white/60" />
      </div>
    </NavLink>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {[
        { label: 'ساعات الحضور', value: '0', icon: Calendar, color: 'emerald', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
        { label: 'المواد المنجزة', value: '0', icon: BookOpen, color: 'blue', bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
        { label: 'الاختبارات القادمة', value: '0', icon: GraduationCap, color: 'purple', bgClass: 'bg-purple-50', textClass: 'text-purple-600' },
        { label: 'التقييم العام', value: '-', icon: Sparkles, color: 'amber', bgClass: 'bg-amber-50', textClass: 'text-amber-600' },
      ].map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${stat.bgClass} flex items-center justify-center ${stat.textClass}`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-black text-slate-800 leading-none mb-0.5">{stat.value}</p>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Quick Actions - mobile */}
    <div className="md:hidden mt-5">
      <h3 className="text-sm font-black text-slate-700 mb-3 px-1">الوصول السريع</h3>
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Calendar, label: 'التقويم', href: '/student/calendar', bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
          { icon: GraduationCap, label: 'الاختبارات', href: '/student/exams', bgClass: 'bg-purple-50', textClass: 'text-purple-600' },
          { icon: LayoutGrid, label: 'المنصات', href: '/student', bgClass: 'bg-slate-50', textClass: 'text-slate-600' },
        ].map((action, idx) => {
          const Icon = action.icon;
          return (
            <NavLink key={idx} to={action.href} className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm active:scale-95 transition-transform">
              <div className={`w-10 h-10 rounded-xl ${action.bgClass} flex items-center justify-center ${action.textClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-600">{action.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>

    {/* Placeholder for user greeting */}
    {user && null}
  </div>
);


export default function StudentDashboard() {
  const [showMore, setShowMore] = useState(false);
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
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      <div className="md:pr-72 min-h-screen flex flex-col">
        {/* Headers */}
        <MobileHeader user={user} />
        <DesktopHeader user={user} />

        {/* Content Area — add bottom padding on mobile for tab bar */}
        <main className="flex-1 overflow-auto pb-24 md:pb-0">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentHome user={user} />} />
            <Route path="calendar" element={<StudentCalendarPage />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="materials" element={<StudentMaterialsPage />} />
            <Route path="exams" element={<StudentExamsPage />} />
            <Route path="scan" element={<StudentScanPage />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar onMoreClick={() => setShowMore(true)} />

      {/* More Bottom Sheet */}
      <MoreSheet isOpen={showMore} onClose={() => setShowMore(false)} />
    </div>
  );
}
