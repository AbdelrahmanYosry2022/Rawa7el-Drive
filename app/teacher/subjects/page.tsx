import { prisma } from '@/lib/prisma';
import { SubjectsList } from '@/components/teacher/subjects-list';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة المواد الدراسية</h1>
          <p className="text-sm text-slate-500 mt-1">
            إضافة وتعديل وحذف المواد الدراسية
          </p>
        </div>
      </div>

      <SubjectsList subjects={subjects} />
    </div>
  );
}
