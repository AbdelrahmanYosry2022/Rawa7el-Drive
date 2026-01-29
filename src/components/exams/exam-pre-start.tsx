'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Clock,
  FileText,
  Award,
  Timer,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type TimerMode = 'NONE' | 'EXAM_TOTAL' | 'PER_QUESTION';

interface ExamPreStartProps {
  exam: {
    id: string;
    title: string;
    subjectTitle: string;
    durationMinutes: number;
    passingScore: number;
    timerMode: TimerMode;
    questionTimeSeconds: number | null;
    questionCount: number;
  };
  lastAttempt: {
    score: number;
    passed: boolean;
    date: string;
  } | null;
}

export function ExamPreStart({ exam, lastAttempt }: ExamPreStartProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    router.push(`/exams/${exam.id}/start`);
  };

  const getTimerDescription = () => {
    switch (exam.timerMode) {
      case 'NONE':
        return 'لا يوجد توقيت محدد - يمكنك الإجابة براحتك';
      case 'EXAM_TOTAL':
        return `${exam.durationMinutes} دقيقة للامتحان بالكامل`;
      case 'PER_QUESTION':
        const time = exam.questionTimeSeconds || 60;
        return `${time} ثانية لكل سؤال`;
      default:
        return '';
    }
  };

  const getTimerIcon = () => {
    switch (exam.timerMode) {
      case 'NONE':
        return <Clock className="w-5 h-5 text-slate-400" />;
      case 'EXAM_TOTAL':
        return <Clock className="w-5 h-5 text-indigo-600" />;
      case 'PER_QUESTION':
        return <Timer className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-right space-y-2">
          <p className="text-xs font-medium text-indigo-600 tracking-[0.2em]">
            اختبار
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {exam.title}
          </h1>
          <p className="text-sm text-slate-500">المادة: {exam.subjectTitle}</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
          {/* Exam Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 text-right">
              معلومات الاختبار
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-right flex-1">
                  <p className="text-xs text-slate-500">عدد الأسئلة</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {exam.questionCount}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-right flex-1">
                  <p className="text-xs text-slate-500">درجة النجاح</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {exam.passingScore}%
                  </p>
                </div>
              </div>
            </div>

            {/* Timer Info */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex-shrink-0 mt-0.5">{getTimerIcon()}</div>
              <div className="text-right flex-1">
                <p className="text-xs font-medium text-slate-700 mb-1">
                  نظام التوقيت
                </p>
                <p className="text-sm text-slate-600">
                  {getTimerDescription()}
                </p>
                {exam.timerMode === 'PER_QUESTION' && (
                  <p className="text-xs text-amber-700 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      سيتم الانتقال تلقائيًا للسؤال التالي عند انتهاء الوقت
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Last Attempt */}
          {lastAttempt && (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 text-right mb-3">
                آخر محاولة
              </h3>
              <div
                className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                  lastAttempt.passed
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {lastAttempt.passed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600" />
                  )}
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        lastAttempt.passed ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {lastAttempt.score}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(lastAttempt.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    lastAttempt.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {lastAttempt.passed ? 'ناجح' : 'راسب'}
                </span>
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="pt-4">
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-6 text-base"
            >
              {isStarting ? 'جارٍ التحميل...' : 'بدء الاختبار'}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-right">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">تعليمات مهمة:</p>
              <ul className="space-y-1 text-blue-800 pr-4">
                <li>• تأكد من اتصالك بالإنترنت قبل البدء</li>
                <li>• لا تغلق نافذة المتصفح أثناء الامتحان</li>
                {exam.timerMode !== 'NONE' && (
                  <li>• سيتم إرسال الإجابات تلقائيًا عند انتهاء الوقت</li>
                )}
                <li>• يمكنك إنهاء الامتحان في أي وقت بالضغط على زر "إنهاء"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
