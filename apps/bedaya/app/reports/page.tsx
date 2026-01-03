'use client';

import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { 
  TrendingUp, 
  ArrowRight,
  Users,
  ClipboardCheck,
  Calendar,
  Download,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">التقارير</h1>
                <p className="text-xs text-slate-500">إحصائيات وتقارير</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الطلاب', value: '45', icon: Users, color: 'emerald' },
            { label: 'نسبة الحضور', value: '87%', icon: ClipboardCheck, color: 'indigo' },
            { label: 'أيام الدراسة', value: '120', icon: Calendar, color: 'amber' },
            { label: 'الحلقات النشطة', value: '3', icon: BarChart3, color: 'pink' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="bg-white border border-slate-100 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-${stat.color}-100 flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Report Types */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 pb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">التقارير المتاحة</h2>
        
        <div className="grid gap-4">
          {[
            { 
              title: 'تقرير الحضور الشهري', 
              description: 'إحصائيات الحضور والغياب لكل شهر',
              icon: ClipboardCheck,
              color: 'indigo'
            },
            { 
              title: 'تقرير الطلاب', 
              description: 'قائمة بجميع الطلاب وبياناتهم',
              icon: Users,
              color: 'emerald'
            },
            { 
              title: 'تقرير الحلقات', 
              description: 'إحصائيات كل حلقة وأداء الطلاب',
              icon: PieChart,
              color: 'amber'
            },
            { 
              title: 'تقرير التقدم', 
              description: 'متابعة تقدم الطلاب في الحفظ',
              icon: TrendingUp,
              color: 'pink'
            },
          ].map((report, idx) => {
            const Icon = report.icon;
            return (
              <Card key={idx} className="bg-white border border-slate-100 rounded-2xl hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-${report.color}-100 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${report.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.title}</h3>
                        <p className="text-sm text-slate-500">{report.description}</p>
                      </div>
                    </div>
                    <Download className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
