'use client';

import { useState } from 'react';
import { submitExam, type ExamSubmissionResult } from '@/app/actions/submitExam';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export type ClientQuestion = {
  id: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE';
  options: string[];
};

export type ExamClientProps = {
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    passingScore: number;
    questions: ClientQuestion[];
  };
};

export function ExamRunner({ exam }: ExamClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ExamSubmissionResult | null>(null);

  const totalQuestions = exam.questions.length;
  const currentQuestion = exam.questions[currentIndex];

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const goNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < totalQuestions) {
      // يمكن تحسين الرسالة لاحقاً بمودال
      alert('الرجاء الإجابة على جميع الأسئلة قبل إنهاء الاختبار.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitExam(exam.id, answers);
      setResult(res);
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إرسال الإجابات');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result && result.success) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        {/* Score Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 space-y-6 text-center">
          <div className="flex justify-center mb-2">
            {result.passed ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            ) : (
              <XCircle className="w-12 h-12 text-rose-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {result.passed ? 'أحسنت! لقد نجحت في الاختبار' : 'لم تصل إلى درجة النجاح'}
          </h2>

          <div className="space-y-2">
            <div className="text-5xl font-black text-indigo-600">
              {result.percentage}%
            </div>
            <p className="text-slate-500 text-sm font-medium">
              النقاط: {result.score} / {result.totalPoints}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                العودة إلى لوحة التحكم
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setAnswers({});
                setCurrentIndex(0);
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              إعادة محاولة الاختبار
            </button>
          </div>
        </div>

        {/* Review Answers Section */}
        {result.details && result.details.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 text-right">مراجعة الإجابات</h3>
            
            {result.details.map((detail, index) => (
            <div
              key={detail.questionId}
              className={`rounded-xl border-2 p-6 space-y-4 ${
                detail.isCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  detail.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-medium text-right">{detail.text}</p>
                </div>
                <div className="flex-shrink-0">
                  {detail.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              </div>

              {/* User Answer */}
              <div className="pr-11 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-700">إجابتك:</span>
                  <span className={`font-medium ${
                    detail.isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {detail.userAnswer || 'لم تجب'}
                  </span>
                  {detail.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>

                {/* Show Correct Answer if Wrong */}
                {!detail.isCorrect && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-700">الإجابة الصحيحة:</span>
                    <span className="font-bold text-green-700">
                      {detail.correctAnswer}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    );
  }

  const progressValue = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const selectedAnswer = answers[currentQuestion.id];

  const renderOptions = () => {
    if (currentQuestion.type === 'TRUE_FALSE') {
      const tfOptions = ['صحيح', 'خطأ'];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {tfOptions.map((opt) => {
            const isActive = selectedAnswer === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(currentQuestion.id, opt)}
                className={`w-full rounded-xl border px-4 py-5 text-sm font-medium transition-all text-center
                  ${isActive
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-700'}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-3 mt-4">
        {currentQuestion.options.map((opt) => {
          const isActive = selectedAnswer === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handleSelect(currentQuestion.id, opt)}
              className={`w-full rounded-xl border px-4 py-4 text-sm text-right font-medium transition-all
                ${isActive
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50 text-slate-700'}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top progress */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-2 text-sm text-slate-500">
          <span>السؤال {currentIndex + 1} من {totalQuestions}</span>
          <span>{Math.round(progressValue)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </header>
      {/* Question card */}
      <main>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <p className="text-xs font-medium text-indigo-600 tracking-[0.2em]">سؤال</p>
          <h1 className="text-lg md:text-xl font-semibold text-slate-900 leading-relaxed">
            {currentQuestion.text}
          </h1>

          {renderOptions()}
        </div>
      </main>

      {/* Navigation */}
      <footer className="mt-4 flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          disabled={currentIndex === 0 || isSubmitting}
          onClick={goPrev}
          className="gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          السابق
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={currentIndex === totalQuestions - 1 ? handleSubmit : goNext}
            disabled={!selectedAnswer || isSubmitting}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جارٍ الإرسال...
              </>
            ) : currentIndex === totalQuestions - 1 ? (
              'إنهاء الاختبار'
            ) : (
              <>
                التالي
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
