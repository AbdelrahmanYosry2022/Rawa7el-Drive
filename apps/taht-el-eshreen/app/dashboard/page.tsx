import { createClient as createServerClient } from '@rawa7el/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { 
  GraduationCap, 
  FileText, 
  FolderOpen, 
  Calendar,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Users,
  ArrowLeft
} from 'lucide-react';

// Enable caching for this page (revalidate every 60 seconds)
export const revalidate = 60;

// Feature card data
const features = [
  {
    id: 'exams',
    title: 'الاختبارات',
    description: 'اختبر معلوماتك وتابع تقدمك',
    icon: GraduationCap,
    href: '/exams',
    color: '#6366F1',
    bgColor: 'bg-indigo-50',
    stats: 'اختبارات متنوعة',
  },
  {
    id: 'resources',
    title: 'المناهج والملفات',
    description: 'تصفح وحمّل المواد الدراسية',
    icon: FileText,
    href: '/resources',
    color: '#10B981',
    bgColor: 'bg-emerald-50',
    stats: 'ملفات ومستندات',
  },
  {
    id: 'activities',
    title: 'الأنشطة والواجبات',
    description: 'تابع الأنشطة والمهام المطلوبة',
    icon: ClipboardList,
    href: '/activities',
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    stats: 'أنشطة تفاعلية',
  },
  {
    id: 'subjects',
    title: 'المواد الدراسية',
    description: 'استعرض جميع المواد المتاحة',
    icon: FolderOpen,
    href: '/subjects',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    stats: 'مواد متعددة',
  },
  {
    id: 'schedule',
    title: 'الجدول والخطط',
    description: 'خطط دراسية مجدولة بالأيام',
    icon: Calendar,
    href: '/schedule',
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    stats: 'قريباً',
    comingSoon: true,
  },
  {
    id: 'progress',
    title: 'تقدمي',
    description: 'تابع إنجازاتك وتطورك',
    icon: TrendingUp,
    href: '/progress',
    color: '#06B6D4',
    bgColor: 'bg-cyan-50',
    stats: 'قريباً',
    comingSoon: true,
  },
];

export default async function Home() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: dbUser } = await supabase
    .from('User')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!dbUser) {
    redirect('/login');
  }

  // Fetch counts for stats
  const [subjectsResult, examsResult, resourcesResult, activitiesResult] = await Promise.all([
    supabase.from('Subject').select('id', { count: 'exact', head: true }),
    supabase.from('Exam').select('id', { count: 'exact', head: true }),
    supabase.from('Resource').select('id', { count: 'exact', head: true }),
    supabase.from('Activity').select('id', { count: 'exact', head: true }),
  ]);

  const subjectsCount = subjectsResult.count || 0;
  const examsCount = examsResult.count || 0;
  const resourcesCount = resourcesResult.count || 0;
  const activitiesCount = activitiesResult.count || 0;

  // Get user's first name for greeting
  const firstName = dbUser.name?.split(' ')[0] || 'طالب';

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-8">
      {/* Welcome Header */}
      <section className="text-right space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">
          أهلاً بك، {firstName}! 👋
        </h1>
        <p className="text-slate-500">
          اختر من الأقسام أدناه للبدء في رحلتك التعليمية
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{subjectsCount}</div>
          <div className="text-xs text-slate-500 mt-1">مادة دراسية</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{examsCount}</div>
          <div className="text-xs text-slate-500 mt-1">اختبار</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{resourcesCount}</div>
          <div className="text-xs text-slate-500 mt-1">ملف ومورد</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{activitiesCount}</div>
          <div className="text-xs text-slate-500 mt-1">نشاط</div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-500">الأقسام الرئيسية</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isComingSoon = feature.comingSoon;
            
            const CardWrapper = isComingSoon ? 'div' : Link;
            const cardProps = isComingSoon ? {} : { href: feature.href };
            
            return (
              isComingSoon ? (
                <div key={feature.id}>
                  <Card 
                  className={`bg-white border border-slate-100 rounded-xl overflow-hidden transition-all duration-200 ${
                    isComingSoon 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:shadow-lg hover:border-slate-200 hover:-translate-y-1 cursor-pointer'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center`}
                        style={{ color: feature.color }}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      {isComingSoon && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                          قريباً
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    
                    {!isComingSoon && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{feature.stats}</span>
                        <ArrowLeft className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>
                </div>
              ) : (
                <Link key={feature.id} href={feature.href}>
                  <Card 
                  className={`bg-white border border-slate-100 rounded-xl overflow-hidden transition-all duration-200 ${
                    isComingSoon 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:shadow-lg hover:border-slate-200 hover:-translate-y-1 cursor-pointer'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center`}
                        style={{ color: feature.color }}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      {isComingSoon && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                          قريباً
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    
                    {!isComingSoon && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{feature.stats}</span>
                        <ArrowLeft className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>
                </Link>
              )
            );
          })}
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">آخر النشاطات</h2>
          <Link href="/exams" className="text-xs text-indigo-600 hover:text-indigo-700">
            عرض الكل
          </Link>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">ابدأ رحلتك التعليمية الآن!</p>
          <p className="text-slate-400 text-xs mt-1">اختر أحد الأقسام أعلاه للبدء</p>
        </div>
      </section>
    </div>
  );
}
