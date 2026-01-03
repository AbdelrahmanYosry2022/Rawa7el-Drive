import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@rawa7el/ui/card';
import { 
  GraduationCap, 
  BookOpen,
  ArrowLeft,
  Sparkles,
  Users,
  Calendar,
  CheckCircle,
  Star
} from 'lucide-react';

const platforms = [
  {
    id: 'bedaya',
    title: 'منصة بداية',
    subtitle: 'للحلقات القرآنية',
    description: 'منصة متكاملة لإدارة الحلقات القرآنية، تسجيل الطلاب، متابعة الحضور والغياب، وتقييم الحفظ والتلاوة',
    icon: BookOpen,
    href: 'http://localhost:3001',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      { icon: Users, text: 'إدارة الطلاب والمعلمين' },
      { icon: Calendar, text: 'متابعة الحضور والغياب' },
      { icon: CheckCircle, text: 'تقييم الحفظ والتلاوة' },
      { icon: Star, text: 'نظام النقاط والمكافآت' },
    ],
    stats: {
      students: '500+',
      teachers: '50+',
      halaqat: '30+',
    },
  },
  {
    id: 'taht-el-eshreen',
    title: 'منصة تحت العشرين',
    subtitle: 'للتعليم الأكاديمي',
    description: 'منصة تعليمية شاملة للاختبارات والمناهج والأنشطة، مصممة لطلاب المرحلة الثانوية والجامعية',
    icon: GraduationCap,
    href: 'http://localhost:3002',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-purple-600',
    features: [
      { icon: GraduationCap, text: 'اختبارات تفاعلية' },
      { icon: BookOpen, text: 'مناهج وملفات دراسية' },
      { icon: CheckCircle, text: 'واجبات وأنشطة' },
      { icon: Star, text: 'تتبع التقدم الأكاديمي' },
    ],
    stats: {
      exams: '200+',
      resources: '1000+',
      students: '2000+',
    },
  },
];

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">رواحل درايف</h1>
                <p className="text-xs text-slate-500">البوابة الرئيسية</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          <span>مرحباً بك في رواحل درايف</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          اختر المنصة التعليمية
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            المناسبة لك
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12">
          منصات تعليمية متكاملة تخدم الحلقات القرآنية والتعليم الأكاديمي
        </p>
      </section>

      {/* Platforms Grid */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            
            return (
              <Link key={platform.id} href={platform.href} target="_blank">
                <Card className="group bg-white border-2 border-slate-100 rounded-3xl overflow-hidden hover:border-slate-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full">
                  <CardContent className="p-0">
                    {/* Gradient Header */}
                    <div className={`bg-gradient-to-br ${platform.gradient} p-8 md:p-10 relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
                      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                      
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6">
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                        <div className="mb-2">
                          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                            {platform.subtitle}
                          </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                          {platform.title}
                        </h2>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-8">
                      <p className="text-slate-600 mb-6 leading-relaxed text-lg">
                        {platform.description}
                      </p>
                      
                      {/* Features */}
                      <div className="grid grid-cols-2 gap-3 mb-8">
                        {platform.features.map((feature, idx) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                              <FeatureIcon className="w-4 h-4 text-slate-400" />
                              <span>{feature.text}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-100">
                        {Object.entries(platform.stats).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-2xl font-bold text-slate-900">{value}</div>
                            <div className="text-xs text-slate-500">
                              {key === 'students' && 'طالب'}
                              {key === 'teachers' && 'معلم'}
                              {key === 'halaqat' && 'حلقة'}
                              {key === 'exams' && 'اختبار'}
                              {key === 'resources' && 'ملف'}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* CTA */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-slate-900">
                          ادخل المنصة
                        </span>
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center group-hover:-translate-x-2 transition-all"
                          style={{ backgroundColor: `${platform.color}15` }}
                        >
                          <ArrowLeft className="w-6 h-6" style={{ color: platform.color }} />
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

      {/* Features Section */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              لماذا رواحل درايف؟
            </h2>
            <p className="text-slate-400 text-lg">
              منصة تعليمية متكاملة بمميزات استثنائية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🚀',
                title: 'سهولة الاستخدام',
                description: 'واجهة بسيطة وسهلة الاستخدام لجميع الأعمار',
              },
              {
                icon: '📊',
                title: 'تقارير شاملة',
                description: 'متابعة دقيقة للتقدم والإنجازات',
              },
              {
                icon: '🔒',
                title: 'أمان وخصوصية',
                description: 'حماية كاملة لبيانات الطلاب والمعلمين',
              },
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">رواحل درايف - منصات تعليمية متكاملة</span>
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
