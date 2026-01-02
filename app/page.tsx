import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, 
  FileText, 
  ClipboardList,
  Calendar,
  TrendingUp,
  BookOpen,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';

export const revalidate = 60;

const platforms = [
  {
    id: 'exams',
    title: 'منصة الاختبارات',
    description: 'اختبر معلوماتك، تابع تقدمك، واحصل على نتائج فورية',
    icon: GraduationCap,
    href: '/exams-platform',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-purple-600',
    features: ['اختبارات تفاعلية', 'نتائج فورية', 'تتبع التقدم'],
  },
  {
    id: 'resources',
    title: 'منصة المناهج والملفات',
    description: 'تصفح وحمّل المواد الدراسية والموارد التعليمية',
    icon: FileText,
    href: '/resources-platform',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-600',
    features: ['ملفات PDF', 'فيديوهات تعليمية', 'مستندات'],
  },
  {
    id: 'activities',
    title: 'منصة الأنشطة والواجبات',
    description: 'تابع الأنشطة المطلوبة وأنجز واجباتك في الوقت المحدد',
    icon: ClipboardList,
    href: '/activities-platform',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-600',
    features: ['واجبات منزلية', 'أوراق عمل', 'مشاريع'],
  },
];

const comingSoonPlatforms = [
  {
    id: 'schedule',
    title: 'منصة الجدول والخطط',
    description: 'خطط دراسية مجدولة بالأيام والأسابيع',
    icon: Calendar,
    color: '#EC4899',
  },
  {
    id: 'progress',
    title: 'منصة تتبع التقدم',
    description: 'تابع إنجازاتك وتطورك الأكاديمي',
    icon: TrendingUp,
    color: '#06B6D4',
  },
];

export default async function LandingPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const firstName = user.firstName || 'طالب';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo/Rawa7el-drive-logo-v2.png"
                alt="Rawa7el Drive"
                width={200}
                height={48}
                className="h-8 w-auto"
                priority
              />
            </div>
            <Link 
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{firstName}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>مرحباً بك في رواحل درايف</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
          منصتك التعليمية المتكاملة
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-8">
          اختر المنصة المناسبة لك وابدأ رحلتك التعليمية الآن
        </p>
      </section>

      {/* Main Platforms */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            
            return (
              <Link key={platform.id} href={platform.href}>
                <Card className="group bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full">
                  <CardContent className="p-0">
                    {/* Gradient Header */}
                    <div className={`bg-gradient-to-br ${platform.gradient} p-8 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                      
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {platform.title}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6">
                      <p className="text-slate-600 mb-4 leading-relaxed">
                        {platform.description}
                      </p>
                      
                      <div className="space-y-2 mb-6">
                        {platform.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="text-sm font-medium text-slate-900">
                          ادخل المنصة
                        </span>
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-900 group-hover:-translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Coming Soon */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">قريباً</h2>
          <p className="text-slate-500">منصات جديدة قيد التطوير</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {comingSoonPlatforms.map((platform) => {
            const Icon = platform.icon;
            
            return (
              <Card key={platform.id} className="bg-slate-50 border border-slate-200 rounded-2xl opacity-60">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {platform.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                          قريباً
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <BookOpen className="w-5 h-5" />
              <span className="text-sm">رواحل درايف - منصة تعليمية متكاملة</span>
            </div>
            <div className="text-sm text-slate-500">
              © 2026 جميع الحقوق محفوظة
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
