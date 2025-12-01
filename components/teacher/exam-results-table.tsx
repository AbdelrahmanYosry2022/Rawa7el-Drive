'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { DeleteSubmissionButton } from '@/components/teacher/delete-submission-button';
import { deleteAllSubmissions } from '@/app/actions/teacher/exams';

interface ExamResultUser {
  id?: string;
  name?: string | null;
  email?: string | null;
}

interface ExamResultSubmission {
  id: string;
  score: number | null;
  passed: boolean;
  createdAt: string; // ISO string
  user: ExamResultUser | null;
}

interface ExamResultsTableProps {
  examId: string;
  submissions: ExamResultSubmission[];
}

export function ExamResultsTable({ examId, submissions }: ExamResultsTableProps) {
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');

  const students = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();

    submissions.forEach((submission) => {
      if (!submission.user) return;
      const key = submission.user.id || submission.user.email || submission.id;
      if (!map.has(key)) {
        const label = submission.user.name || submission.user.email || 'طالب غير معروف';
        map.set(key, { id: key, label });
      }
    });

    return Array.from(map.values());
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    if (selectedStudentId === 'ALL') return submissions;
    return submissions.filter((submission) => {
      const key = submission.user?.id || submission.user?.email || submission.id;
      return key === selectedStudentId;
    });
  }, [selectedStudentId, submissions]);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('ar-EG');
  };

  const handleDeleteAll = async () => {
    if (!submissions.length) return;

    const confirmed = window.confirm(
      'هل أنت متأكد من حذف جميع محاولات هذا الاختبار؟ لا يمكن التراجع عن هذا الإجراء.',
    );

    if (!confirmed) return;

    try {
      setIsDeletingAll(true);
      await deleteAllSubmissions(examId);
      // بعد الحذف نعمل تحديث للصفحة لعرض البيانات المحدثة
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete all submissions', error);
      alert('حدث خطأ أثناء حذف المحاولات');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const hasSubmissions = submissions.length > 0;

  return (
    <Card className="bg-white border border-slate-100 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">نتائج الطلاب</h3>
            <span className="text-xs text-slate-400">{submissions.length} محاولة</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Filter by student */}
            {students.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">تصفية حسب الطالب:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">جميع الطلاب</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Delete all submissions */}
            {hasSubmissions && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="gap-1 border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-3 h-3" />
                <span className="text-xs">حذف كل المحاولات</span>
              </Button>
            )}
          </div>
        </div>

        {!hasSubmissions ? (
          <p className="text-xs text-slate-500 py-6 text-center">لم يقم أحد بأداء هذا الاختبار بعد.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الطالب</TableHead>
                <TableHead>الدرجة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => {
                const score = submission.score ?? 0;
                const passed = submission.passed;

                return (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex items-center justify-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-semibold text-indigo-700">
                          {submission.user?.name?.charAt(0).toUpperCase() ||
                            submission.user?.email?.charAt(0).toUpperCase() ||
                            '?'}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-slate-800">
                            {submission.user?.name || submission.user?.email || 'طالب غير معروف'}
                          </p>
                          {submission.user?.name && submission.user?.email && (
                            <p className="text-[11px] text-slate-500">{submission.user.email}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{score}/100</TableCell>
                    <TableCell>
                      <span
                        className={
                          passed
                            ? 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100'
                        }
                      >
                        {passed ? 'ناجح' : 'راسب'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(submission.createdAt)}</TableCell>
                    <TableCell>
                      <DeleteSubmissionButton submissionId={submission.id} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
