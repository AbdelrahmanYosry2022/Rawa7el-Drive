import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { 
  ClipboardList,
  FileEdit,
  Briefcase,
  BookOpen,
  PenTool,
  File,
  FolderOpen,
  ArrowRight,
  Calendar,
  Clock
} from 'lucide-react';

export const revalidate = 60;

const activityTypeIcons = {
  WORKSHEET: FileEdit,
  PROJECT: Briefcase,
  ASSIGNMENT: ClipboardList,
  PRACTICE: PenTool,
  READING: BookOpen,
  OTHER: File,
};

const activityTypeLabels = {
  WORKSHEET: 'ورقة عمل',
  PROJECT: 'مشروع',
  ASSIGNMENT: 'واجب',
  PRACTICE: 'تدريب',
  READING: 'قراءة',
  OTHER: 'نشاط آخر',
};

const activityTypeColors = {
  WORKSHEET: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  PROJECT: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  ASSIGNMENT: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  PRACTICE: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  READING: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  OTHER: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return new Date() > date;
}

function getDaysRemaining(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return 'منتهي';
  if (days === 0) return 'اليوم';
  if (days === 1) return 'غداً';
  return `${days} يوم`;
}

export default async function ActivitiesPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch all activities grouped by subject
  const subjects = await prisma.subject.findMany({
    include: {
      activities: {
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      },
      _count: {
        select: { activities: true },
      },
    },
    orderBy: { title: 'asc' },
  });

  const totalActivities = subjects.reduce((sum, s) => sum + s._count.activities, 0);

  // Separate upcoming and past activities
  const now = new Date();
  const upcomingActivities = subjects.flatMap(s => 
    s.activities.filter(a => !a.dueDate || new Date(a.dueDate) >= now)
      .map(a => ({ ...a, subjectTitle: s.title, subjectColor: s.color }))
  ).sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-slate-400 hover:text-slate-600">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">منصة الأنشطة والواجبات</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalActivities} نشاط متاح
          </p>
        </div>
      </div>

      {/* Upcoming Activities */}
      {upcomingActivities.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            الأنشطة القادمة
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingActivities.slice(0, 6).map((activity) => {
              const Icon = activityTypeIcons[activity.type];
              const colors = activityTypeColors[activity.type];
              const label = activityTypeLabels[activity.type];
              const overdue = isOverdue(activity.dueDate);
              
              return (
                <Card 
                  key={activity.id} 
                  className={`bg-white border rounded-xl overflow-hidden ${
                    overdue ? 'border-red-200' : 'border-slate-100'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-900 line-clamp-2">
                          {activity.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {activity.subjectTitle}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                        {label}
                      </span>
                      {activity.dueDate && (
                        <div className={`flex items-center gap-1 text-[10px] ${
                          overdue ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>{getDaysRemaining(activity.dueDate)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Activities by Subject */}
      {subjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">لا توجد أنشطة حالياً</p>
          <p className="text-slate-400 text-sm mt-1">سيتم إضافة الأنشطة قريباً</p>
        </div>
      ) : (
        <div className="space-y-8">
          <h2 className="text-sm font-semibold text-slate-500">حسب المادة</h2>
          
          {subjects.map((subject) => (
            <section key={subject.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: subject.color ? `${subject.color}20` : '#E0E7FF',
                      color: subject.color || '#6366F1'
                    }}
                  >
                    {subject.icon ? (
                      <span className="text-lg">{subject.icon}</span>
                    ) : (
                      <FolderOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{subject.title}</h3>
                    <p className="text-xs text-slate-400">{subject._count.activities} نشاط</p>
                  </div>
                </div>
                <Link 
                  href={`/subjects/${subject.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  عرض المادة
                </Link>
              </div>

              {subject.activities.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-6 text-center">
                  <p className="text-slate-400 text-sm">لا توجد أنشطة في هذه المادة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subject.activities.map((activity) => {
                    const Icon = activityTypeIcons[activity.type];
                    const colors = activityTypeColors[activity.type];
                    const label = activityTypeLabels[activity.type];
                    const overdue = isOverdue(activity.dueDate);
                    
                    return (
                      <Card 
                        key={activity.id} 
                        className={`bg-white border rounded-xl ${
                          overdue ? 'border-red-200' : 'border-slate-100'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-slate-900 line-clamp-2">
                                {activity.title}
                              </h4>
                              {activity.description && (
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                              {label}
                            </span>
                            {activity.dueDate && (
                              <div className={`flex items-center gap-1 text-[10px] ${
                                overdue ? 'text-red-500' : 'text-slate-400'
                              }`}>
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(activity.dueDate)}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
