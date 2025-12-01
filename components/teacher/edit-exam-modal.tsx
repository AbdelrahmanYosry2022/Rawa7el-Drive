'use client';

import { useState, useTransition, FormEvent } from 'react';
import { updateExam } from '@/app/actions/teacher/exams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Subject {
  id: string;
  title: string;
}

interface EditExamModalProps {
  examId: string;
  initialTitle: string;
  initialDurationMinutes: number;
  initialPassingScore: number;
  initialTimerMode: 'NONE' | 'EXAM_TOTAL' | 'PER_QUESTION';
  initialQuestionTimeSeconds: number | null;
  initialSubjectId: string;
  subjects: Subject[];
}

export function EditExamModal({
  examId,
  initialTitle,
  initialDurationMinutes,
  initialPassingScore,
  initialTimerMode,
  initialQuestionTimeSeconds,
  initialSubjectId,
  subjects,
}: EditExamModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [duration, setDuration] = useState(String(initialDurationMinutes));
  const [passingScore, setPassingScore] = useState(String(initialPassingScore));
  const [timerMode, setTimerMode] = useState<'NONE' | 'EXAM_TOTAL' | 'PER_QUESTION'>(initialTimerMode);
  const [questionTime, setQuestionTime] = useState(String(initialQuestionTimeSeconds || 60));
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const durationMinutes = parseInt(duration || '30', 10);
    const passing = parseInt(passingScore || '60', 10);

    startTransition(async () => {
      try {
        const questionTimeSeconds = timerMode === 'PER_QUESTION' ? parseInt(questionTime || '60', 10) : null;
        await updateExam(examId, {
          title,
          durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : undefined,
          passingScore: Number.isFinite(passing) ? passing : undefined,
          timerMode,
          questionTimeSeconds,
          subjectId: subjectId !== initialSubjectId ? subjectId : undefined,
        });
        setOpen(false);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        onClick={() => setOpen(true)}
        aria-label="تعديل الاختبار"
      >
        <Pencil className="w-4 h-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">تعديل الاختبار</h3>
              <button
                type="button"
                onClick={() => !isPending && setOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 text-right">
              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor="exam-title-edit">
                  عنوان الاختبار
                </label>
                <Input
                  id="exam-title-edit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* اختيار المادة (الفولدر) */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor="exam-subject-edit">
                  المادة (الفولدر)
                </label>
                <select
                  id="exam-subject-edit"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.title}
                    </option>
                  ))}
                </select>
                {subjectId !== initialSubjectId && (
                  <p className="text-[10px] text-amber-600">
                    ⚠️ سيتم نقل الاختبار إلى مادة أخرى
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500" htmlFor="exam-duration-edit">
                    مدة الاختبار (بالدقائق)
                  </label>
                  <Input
                    id="exam-duration-edit"
                    type="number"
                    min={5}
                    max={300}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500" htmlFor="exam-passing-edit">
                    درجة النجاح (%)
                  </label>
                  <Input
                    id="exam-passing-edit"
                    type="number"
                    min={1}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">نظام التوقيت</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setTimerMode('NONE')}
                      className={`px-3 py-2 text-xs rounded-lg border transition text-right ${
                        timerMode === 'NONE'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium">بدون توقيت</div>
                      <div className="text-[10px] text-slate-500">يمكن للطالب الإجابة براحته</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimerMode('EXAM_TOTAL')}
                      className={`px-3 py-2 text-xs rounded-lg border transition text-right ${
                        timerMode === 'EXAM_TOTAL'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium">توقيت للامتحان ككل</div>
                      <div className="text-[10px] text-slate-500">عد تنازلي للامتحان بالكامل</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimerMode('PER_QUESTION')}
                      className={`px-3 py-2 text-xs rounded-lg border transition text-right ${
                        timerMode === 'PER_QUESTION'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium">توقيت لكل سؤال</div>
                      <div className="text-[10px] text-slate-500">انتقال تلقائي عند انتهاء الوقت</div>
                    </button>
                  </div>
                </div>

                {timerMode === 'PER_QUESTION' && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500" htmlFor="question-time-edit">
                      الوقت الافتراضي لكل سؤال (بالثواني)
                    </label>
                    <Input
                      id="question-time-edit"
                      type="number"
                      min={10}
                      max={600}
                      value={questionTime}
                      onChange={(e) => setQuestionTime(e.target.value)}
                      className="border-slate-200 text-slate-900"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => !isPending && setOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isPending}
                >
                  {isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
