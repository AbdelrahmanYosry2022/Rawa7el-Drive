'use client';

import { useState, useTransition, FormEvent } from 'react';
import { addQuestion, deleteQuestion } from '@/app/actions/teacher/exams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BulkImportDialog } from '@/components/teacher/bulk-import-dialog';

export type ClientQuestion = {
  id: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE';
  options: string[];
  correctAnswer: string;
  points: number;
};

interface ExamQuestionBuilderProps {
  examId: string;
  initialQuestions: ClientQuestion[];
}

export function ExamQuestionBuilder({ examId, initialQuestions }: ExamQuestionBuilderProps) {
  const router = useRouter();
  const [questions] = useState<ClientQuestion[]>(initialQuestions);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'MCQ' | 'TRUE_FALSE'>('MCQ');
  const [points, setPoints] = useState('10');
  const [mcqOptions, setMcqOptions] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const numericPoints = parseInt(points || '10', 10);

    const payload = {
      text: questionText,
      type: questionType,
      options: questionType === 'MCQ' ? mcqOptions : undefined,
      correctAnswer,
      points: Number.isFinite(numericPoints) ? numericPoints : 10,
    } as const;

    startTransition(async () => {
      try {
        await addQuestion(examId, payload);
        // reset
        setQuestionText('');
        setPoints('10');
        setMcqOptions(['', '', '', '']);
        setCorrectAnswer('');
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    setMcqOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleDeleteQuestion = (id: string) => {
    startTransition(async () => {
      try {
        await deleteQuestion(id);
        router.refresh();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const trueFalseOptions = ['صحيح', 'خطأ'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left: question form */}
      <Card className="bg-white border border-slate-100 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 text-right flex-1">
              <h3 className="text-sm font-semibold text-slate-900">إضافة سؤال جديد</h3>
              <p className="text-xs text-slate-500">قم بإضافة نص السؤال ونوعه والإجابة الصحيحة.</p>
            </div>
            <BulkImportDialog examId={examId} onSuccess={() => router.refresh()} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div className="space-y-1">
              <label className="text-xs text-slate-500" htmlFor="question-text">
                نص السؤال
              </label>
              <Input
                id="question-text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
                className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                placeholder="اكتب نص السؤال هنا"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">نوع السؤال</label>
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionType('MCQ');
                      setCorrectAnswer('');
                    }}
                    className={`flex-1 px-3 py-1.5 ${
                      questionType === 'MCQ'
                        ? 'bg-white text-indigo-600 font-semibold shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    اختيارات (MCQ)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionType('TRUE_FALSE');
                      setCorrectAnswer('');
                    }}
                    className={`flex-1 px-3 py-1.5 border-r border-slate-200 ${
                      questionType === 'TRUE_FALSE'
                        ? 'bg-white text-indigo-600 font-semibold shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    صح / خطأ
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor="points">
                  الدرجة (نقاط)
                </label>
                <Input
                  id="points"
                  type="number"
                  min={1}
                  max={100}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {questionType === 'MCQ' ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">خيارات الإجابة (اختر الإجابة الصحيحة)</p>
                <div className="space-y-2">
                  {mcqOptions.map((opt, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-2 text-xs text-slate-600"
                    >
                      <input
                        type="radio"
                        name="correctOption"
                        className="h-3 w-3 text-indigo-600 border-slate-300"
                        checked={correctAnswer === opt && !!opt}
                        onChange={() => opt && setCorrectAnswer(opt)}
                      />
                      <Input
                        value={opt}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="border-slate-200 text-slate-900 placeholder:text-slate-400 h-8 text-xs"
                        placeholder={`الخيار ${index + 1}`}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">اختر الإجابة الصحيحة</p>
                <div className="flex gap-3 text-xs">
                  {trueFalseOptions.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name="tfCorrect"
                        className="h-3 w-3 text-indigo-600 border-slate-300"
                        checked={correctAnswer === opt}
                        onChange={() => setCorrectAnswer(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isPending}
              >
                {isPending ? 'جاري الإضافة...' : 'إضافة السؤال'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Right: questions list */}
      <Card className="bg-white border border-slate-100 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">الأسئلة الحالية</h3>
            <span className="text-xs text-slate-400">{questions.length} سؤال</span>
          </div>

          {questions.length === 0 ? (
            <p className="text-xs text-slate-500 mt-4">لا توجد أسئلة بعد لهذا الاختبار.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="space-y-1 text-xs text-right flex-1">
                    <p className="font-medium text-slate-800">
                      {index + 1}. {q.text}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      النوع: {q.type === 'MCQ' ? 'اختيارات' : 'صح / خطأ'} · الدرجة: {q.points}
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      الإجابة الصحيحة: {q.correctAnswer}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                    onClick={() => handleDeleteQuestion(q.id)}
                    aria-label="حذف السؤال"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
