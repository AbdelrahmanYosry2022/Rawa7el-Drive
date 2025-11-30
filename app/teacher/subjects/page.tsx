import { prisma } from '@/lib/prisma';
import { deleteSubject } from '@/app/actions/teacher/subjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreateSubjectModal } from '@/components/teacher/create-subject-modal';
import { GraduationCap, Trash2, Edit, Folder } from 'lucide-react';

async function handleDeleteSubject(formData: FormData) {
  'use server';

  const id = String(formData.get('id') || '');
  if (!id) return;

  await deleteSubject(id);
}

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
        <div className="space-y-1 text-right">
          <h2 className="text-xl font-semibold text-slate-900">إدارة المواد الدراسية</h2>
          <p className="text-xs text-slate-500">
            أنشئ مواد جديدة، وعدّل أو احذف المواد الحالية. هذه الواجهة مخصصة للمعلم/المشرف.
          </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((subject) => (
              <Card
                key={subject.id}
                className="bg-white border border-slate-100 shadow-sm rounded-xl hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        {subject.icon ? (
                          <span className="text-xl">{subject.icon}</span>
                        ) : (
                          <Folder className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">{subject.title}</p>
                        {subject.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{subject.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {subject._count.exams} اختبار
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-3 border-t border-slate-100 mt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      disabled
                      aria-label="تعديل المادة (قريباً)"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <form action={handleDeleteSubject}>
                      <input type="hidden" name="id" value={subject.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        aria-label="حذف المادة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
