'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, GraduationCap, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { deleteSubject } from '@/app/actions/teacher/subjects';
import { EditSubjectModal } from '@/components/teacher/edit-subject-modal';

export type TeacherSubjectItem = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  _count: {
    exams: number;
  };
};

interface SubjectsListProps {
  subjects: TeacherSubjectItem[];
}

export function SubjectsList({ subjects }: SubjectsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteSubject(id);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {subjects.map((subject) => (
        <Card
          key={subject.id}
          className="bg-white border border-slate-100 shadow-sm rounded-xl hover:border-indigo-200 hover:shadow-md transition-all duration-150"
        >
          <CardContent className="p-5 space-y-3">
            <Link
              href={`/teacher/subjects/${subject.id}`}
              className="block space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    {subject.icon ? (
                      <span className="text-xl">{subject.icon}</span>
                    ) : (
                      <Folder className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {subject.title}
                    </p>
                    {subject.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 min-h-[1.5rem]">
                        {subject.description}
                      </p>
                    )}
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full bg-slate-50 text-[10px] font-medium text-slate-500 whitespace-nowrap">
                  {subject._count.exams} اختبار
                </span>
              </div>
            </Link>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
              <div className="flex items-center gap-1">
                <EditSubjectModal subject={subject} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(subject.id)}
                  disabled={isPending}
                  aria-label="حذف المادة"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {subject._count.exams} اختبار
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
