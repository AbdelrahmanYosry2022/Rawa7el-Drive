import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FolderOpen, 
  ArrowRight,
  GraduationCap,
  FileText,
  ClipboardList,
  ArrowLeft
} from 'lucide-react';

export const revalidate = 60;

export default async function SubjectsListPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch all subjects with counts
  const subjects = await prisma.subject.findMany({
    include: {
      _count: {
        select: { 
          exams: true,
          resources: true,
          activities: true,
        },
      },
    },
    orderBy: { title: 'asc' },
  });

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-slate-400 hover:text-slate-600">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">المواد الدراسية</h1>
          <p className="text-sm text-slate-500 mt-1">
            {subjects.length} مادة متاحة
          </p>
        </div>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">لا توجد مواد دراسية حالياً</p>
          <p className="text-slate-400 text-sm mt-1">سيتم إضافة المواد قريباً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject) => (
            <Link key={subject.id} href={`/subjects/${subject.id}`}>
              <Card className="bg-white border border-slate-100 rounded-xl hover:shadow-lg hover:border-slate-200 hover:-translate-y-1 transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: subject.color ? `${subject.color}20` : '#E0E7FF',
                        color: subject.color || '#6366F1'
                      }}
                    >
                      {subject.icon ? (
                        <span className="text-2xl">{subject.icon}</span>
                      ) : (
                        <FolderOpen className="w-7 h-7" />
                      )}
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {subject.title}
                    </h3>
                    {subject.description && (
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {subject.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{subject._count.exams} اختبار</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{subject._count.resources} ملف</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>{subject._count.activities} نشاط</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
