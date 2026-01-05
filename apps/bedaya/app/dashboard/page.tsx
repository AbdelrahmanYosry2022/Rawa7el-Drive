import { createClient } from '@rawa7el/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import { 
  Users, 
  Calendar, 
  BookOpen,
  UserPlus,
  ClipboardCheck,
  TrendingUp,
  ArrowLeft,
  Settings,
  LogOut,
  Bell,
  User,
  FolderOpen,
  GraduationCap
} from 'lucide-react';

const quickActions = [
  {
    id: 'lectures',
    title: 'المحاضرات',
    description: 'إدارة المحاضرات والمواد التعليمية والمواعيد من مكان واحد',
    icon: GraduationCap,
    href: '/lectures',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'calendar',
    title: 'التقويم',
    description: 'عرض جدول المحاضرات والمواعيد الشهرية',
    icon: Calendar,
    href: '/calendar',
    color: '#0EA5E9',
    gradient: 'from-sky-500 to-cyan-600',
  },
  {
    id: 'students',
    title: 'إدارة الطلاب',
    description: 'تسجيل طلاب جدد، عرض وتعديل بيانات الطلاب',
    icon: Users,
    href: '/students',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'attendance',
    title: 'الحضور والغياب',
    description: 'تسجيل حضور وغياب الطلاب اليومي',
    icon: ClipboardCheck,
    href: '/attendance',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'library',
    title: 'مكتبة المواد',
    description: 'تصفح وتنظيم جميع المواد التعليمية في تصنيفات',
    icon: FolderOpen,
    href: '/library',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'reports',
    title: 'التقارير',
    description: 'تقارير الحضور والتقدم والإحصائيات',
    icon: TrendingUp,
    href: '/reports',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-600',
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('User')
    .select('name')
    .eq('id', user.id)
    .single();

  const firstName = (profile as any)?.name || 'مستخدم';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">منصة بداية</h1>
                <p className="text-xs text-slate-500">للحلقات القرآنية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <User className="w-5 h-5 text-slate-600" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              مرحباً، {firstName} 👋
            </h2>
            <p className="text-emerald-100 text-lg">
              أهلاً بك في منصة بداية لإدارة الحلقات القرآنية
            </p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الطلاب', value: '0', icon: Users, color: 'emerald' },
            { label: 'الحضور اليوم', value: '0', icon: ClipboardCheck, color: 'indigo' },
            { label: 'الحلقات النشطة', value: '0', icon: BookOpen, color: 'amber' },
            { label: 'نسبة الحضور', value: '0%', icon: TrendingUp, color: 'pink' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="bg-white border border-slate-100 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">الإجراءات السريعة</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Link key={action.id} href={action.href}>
                <Card className="group bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      {/* Icon Section */}
                      <div className={`bg-gradient-to-br ${action.gradient} p-6 flex items-center justify-center`}>
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col justify-center">
                        <h4 className="text-lg font-semibold text-slate-900 mb-1">
                          {action.title}
                        </h4>
                        <p className="text-sm text-slate-500 mb-3">
                          {action.description}
                        </p>
                        <div className="flex items-center text-sm font-medium" style={{ color: action.color }}>
                          <span>الدخول</span>
                          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick Add Student Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Link href="/students/new">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full px-6 py-6 shadow-lg hover:shadow-xl transition-all">
            <UserPlus className="w-5 h-5 ml-2" />
            إضافة طالب جديد
          </Button>
        </Link>
      </div>
    </div>
  );
}
