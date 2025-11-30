import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { CreateSubjectModal } from '@/components/teacher/create-subject-modal';
import { SubjectsList } from '@/components/teacher/subjects-list';
import { LayoutDashboard } from 'lucide-react';

export default async function TeacherSubjectsPage() {
  const subjects = await prisma.subject.findMany({
    include: {
      _count: {
        select: { exams: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1 text-right flex flex-row gap-4 items-center flex-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <LayoutDashboard className="w-5 h-5" />
          </div>

          <div className="flex flex-col items-start justify-start gap-2">
            <h2 className="text-xl font-semibold text-slate-900">إدارة المواد الدراسية</h2>
            <p className="text-xs text-slate-500">
              أنشئ مواد جديدة، وعدّل أو احذف المواد الحالية. هذه الواجهة مخصصة للمعلم/المشرف.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <CreateSubjectModal />
        </div>
      </div>
      {/* Subjects list as cards */}
      {subjects.length === 0 ? (
        <Card className="bg-white border border-slate-100 shadow-sm">
          <CardContent className="py-10 text-center text-slate-500 text-sm">
            لا توجد مواد حالياً. ابدأ بإضافة أول مادة من زر "إنشاء مادة" بالأعلى.
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">جميع المواد</h3>
            <span className="text-xs text-slate-400">{subjects.length} مادة</span>
          </div>

          <SubjectsList subjects={subjects} />
        </section>
      )}
    </div>
  );
}
