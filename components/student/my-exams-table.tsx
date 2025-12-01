'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface MyExamQuestionDetail {
  questionId: string;
  text: string;
  options: string[];
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface MyExamSubmissionClient {
  id: string;
  examTitle: string;
  subjectTitle: string;
  createdAt: string; // ISO string
  percentage: number;
  passed: boolean;
  details: MyExamQuestionDetail[];
}

interface MyExamsTableProps {
  submissions: MyExamSubmissionClient[];
}

export function MyExamsTable({ submissions }: MyExamsTableProps) {
  const [selected, setSelected] = useState<MyExamSubmissionClient | null>(null);

  const handleOpen = (submission: MyExamSubmissionClient) => {
    setSelected(submission);
  };

  const handleClose = () => {
    setSelected(null);
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      <Card className="bg-white border border-slate-100 shadow-sm">
        <CardContent className="p-4">
          {submissions.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              لم تقم بأداء أي اختبار بعد.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاختبار</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الدرجة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => {
                  const score = submission.percentage ?? 0;
                  const passed = submission.passed;

                  return (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex flex-col items-start space-y-0.5">
                          <span className="text-sm font-medium text-slate-900">
                            {submission.examTitle}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            المادة: {submission.subjectTitle}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(submission.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-900">
                        {score}%
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            passed
                              ? 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100'
                          }
                        >
                          {passed ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              ناجح
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              راسب
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleOpen(submission)}
                          className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
                        >
                          عرض النتيجة
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-right space-y-1">
                <h2 className="text-base font-semibold text-slate-900">
                  {selected.examTitle}
                </h2>
                <p className="text-[11px] text-slate-500">المادة: {selected.subjectTitle}</p>
                <p className="text-[11px] text-slate-500">
                  تاريخ الحل: {formatDate(selected.createdAt)}
                </p>
              </div>
              <div className="text-left flex flex-col items-start gap-2">
                <span className="text-xs text-slate-500">النتيجة الإجمالية</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {selected.percentage}%
                  </span>
                  <span
                    className={
                      selected.passed
                        ? 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100'
                    }
                  >
                    {selected.passed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        ناجح
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        راسب
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200" />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 text-right">
                تفاصيل الأسئلة
              </h3>
              {selected.details.map((q, index) => (
                <div
                  key={q.questionId}
                  className="border border-slate-100 rounded-xl p-3 space-y-2 bg-slate-50/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-800 text-right flex-1">
                      {index + 1}. {q.text}
                    </p>
                    <span
                      className={
                        q.isCorrect
                          ? 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100'
                      }
                    >
                      {q.isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 text-right">
                    <p>
                      <span className="font-semibold text-slate-700">إجابتك:</span>{' '}
                      <span className={q.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {q.userAnswer ?? 'لم تُجِب على هذا السؤال'}
                      </span>
                    </p>
                    {!q.isCorrect && (
                      <p>
                        <span className="font-semibold text-slate-700">الإجابة الصحيحة:</span>{' '}
                        <span className="text-slate-800">{q.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center rounded-full px-4 py-1.5 text-[12px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
