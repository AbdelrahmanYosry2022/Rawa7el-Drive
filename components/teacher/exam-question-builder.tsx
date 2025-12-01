'use client';

import { useState, useTransition, FormEvent } from 'react';
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  addQuestionsBulk,
  type AddQuestionsBulkResult,
} from '@/app/actions/teacher/exams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [isImportPending, startImportTransition] = useTransition();
  const [editingQuestion, setEditingQuestion] = useState<ClientQuestion | null>(null);

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

  const handleEditQuestion = (question: ClientQuestion) => {
    setEditingQuestion(question);
    setQuestionText(question.text);
    setQuestionType(question.type);
    setPoints(question.points.toString());
    setCorrectAnswer(question.correctAnswer);
    if (question.type === 'MCQ') {
      setMcqOptions(question.options.length === 4 ? question.options : ['', '', '', '']);
    }
  };

  const handleUpdateQuestion = (e: FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const numericPoints = parseInt(points || '10', 10);
    const payload = {
      text: questionText,
      type: questionType,
      options: questionType === 'MCQ' ? mcqOptions : ['صحيح', 'خطأ'],
      correctAnswer,
      points: Number.isFinite(numericPoints) ? numericPoints : 10,
    };

    startTransition(async () => {
      try {
        await updateQuestion(editingQuestion.id, payload);
        setEditingQuestion(null);
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

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setPoints('10');
    setMcqOptions(['', '', '', '']);
    setCorrectAnswer('');
    setQuestionType('MCQ');
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

  const handleOpenImport = () => {
    setIsImportOpen(true);
  };

  const handleCloseImport = () => {
    if (isImportPending) return;
    setIsImportOpen(false);
  };

  const handleImportSubmit = () => {
    if (!importJson.trim()) {
      alert('الرجاء لصق JSON قبل الاستيراد.');
      return;
    }

    startImportTransition(async () => {
      try {
        const result: AddQuestionsBulkResult = await addQuestionsBulk(examId, importJson);

        if (result.success) {
          const count = result.count ?? 0;
          alert(`تم استيراد ${count} سؤالًا بنجاح.`);
          setImportJson('');
          setIsImportOpen(false);
          router.refresh();
        } else {
          alert(result.error || 'فشل استيراد الأسئلة. تحقق من صيغة JSON.');
        }
      } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء استيراد الأسئلة.');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left: question form */}
      <Card className="bg-white border border-slate-100 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 text-right flex-1">
              <h3 className="text-sm font-semibold text-slate-900">
                {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
              </h3>
              <p className="text-xs text-slate-500">
                {editingQuestion
                  ? 'قم بتعديل بيانات السؤال ثم اضغط حفظ التعديلات.'
                  : 'قم بإضافة نص السؤال ونوعه والإجابة الصحيحة.'}
              </p>
            </div>
            <Button
              type="button"
              className="text-[11px] border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 bg-white px-3 py-1 h-8"
              onClick={handleOpenImport}
              disabled={isPending || isImportPending}
            >
              {isImportPending ? 'جاري الاستيراد...' : 'استيراد JSON'}
            </Button>
          </div>

          <form onSubmit={editingQuestion ? handleUpdateQuestion : handleSubmit} className="space-y-4 text-right">
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
                      <span className="text-slate-900 font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-start items-center pt-2 gap-2">
              {editingQuestion && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isPending}
                  className="h-9 px-4 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
                >
                  إلغاء
                </Button>
              )}
              <Button
                type="submit"
                className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isPending}
              >
                {editingQuestion
                  ? isPending
                    ? 'جاري الحفظ...'
                    : 'حفظ التعديلات'
                  : isPending
                  ? 'جاري الإضافة...'
                  : 'إضافة السؤال'}
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
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 flex-shrink-0"
                      onClick={() => handleEditQuestion(q)}
                      aria-label="تعديل السؤال"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-900">استيراد أسئلة من JSON</h3>
              <button
                type="button"
                onClick={handleCloseImport}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                aria-label="إغلاق نافذة الاستيراد"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-500 text-right">
              الصق هنا مصفوفة JSON تحتوي على الأسئلة، ثم اضغط "استيراد الأسئلة".
            </p>

            <textarea
              className="w-full min-h-[180px] rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='[
  {
    "text": "Question text?",
    "type": "MCQ",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "points": 10
  }
]'
            />

            <div className="rounded-md bg-slate-50 border border-slate-100 p-3">
              <p className="text-[11px] text-slate-500 mb-1 text-right">مثال على الصيغة المتوقعة:</p>
              <pre className="text-[10px] text-left whitespace-pre overflow-x-auto bg-indigo-50 text-indigo-900 rounded-md p-2 rtl:text-right border border-indigo-100">
{`[
  {
    "text": "Question text?",
    "type": "MCQ",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "points": 10
  }
]`}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="text-xs hover:bg-red-700 "
                onClick={handleCloseImport}
                disabled={isImportPending}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                onClick={handleImportSubmit}
                disabled={isImportPending}
              >
                {isImportPending ? 'جاري الاستيراد...' : 'استيراد الأسئلة'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
