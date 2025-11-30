'use client';

import { useState } from 'react';
import { submitExam } from '@/app/actions/submitExam';

type Question = {
  id: string;
  text: string;
  type: 'MCQ' | 'TRUE_FALSE';
  options: any; // In practice, cast to string[]
};

type ExamProps = {
  exam: {
    id: string;
    title: string;
    questions: Question[];
    passingScore: number;
  };
};

export function ExamEngine({ exam }: ExamProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    totalPoints: number;
    passed: boolean;
  } | null>(null);

  const handleOptionSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < exam.questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitExam(exam.id, answers);
      if (response.success) {
        setResult({
          score: response.score!,
          totalPoints: response.totalPoints!,
          passed: response.passed!,
        });
      } else {
        alert(response.error || 'Something went wrong');
      }
    } catch (e) {
      console.error(e);
      alert('Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-zinc-200 text-center space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
          {result.passed ? '🎉 Mabrouk!' : '❌ Keep Trying'}
        </h2>
        <div className="py-8">
          <div className="text-6xl font-black text-blue-600 mb-2">
            {Math.round((result.score / result.totalPoints) * 100)}%
          </div>
          <p className="text-zinc-500 text-lg">
            You scored {result.score} out of {result.totalPoints}
          </p>
        </div>
        <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
            {result.passed ? (
                <p className="text-green-600 font-medium">You passed the exam successfully.</p>
            ) : (
                <p className="text-red-600 font-medium">You did not reach the passing score of {exam.passingScore}.</p>
            )}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-medium transition-colors"
        >
          Take Exam Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
        <p className="text-zinc-500">Answer all questions below to complete the exam.</p>
      </div>

      <div className="space-y-6">
        {exam.questions.map((q, idx) => {
          const options = Array.isArray(q.options) ? (q.options as string[]) : [];
          
          // If TRUE_FALSE, force options if not present
          const displayOptions = q.type === 'TRUE_FALSE' ? ['True', 'False'] : options;

          return (
            <div key={q.id} className="p-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
              <h3 className="text-lg font-medium mb-4 flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full text-sm font-bold">
                  {idx + 1}
                </span>
                {q.text}
              </h3>

              <div className="space-y-3 pl-11">
                {displayOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      answers[q.id] === opt
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                        : 'border-zinc-200 hover:border-blue-200 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleOptionSelect(q.id, opt)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-6 bg-white p-4 rounded-xl shadow-lg border border-zinc-200 flex justify-between items-center">
        <div className="text-sm text-zinc-500">
          {Object.keys(answers).length} of {exam.questions.length} answered
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors shadow-sm"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>
    </div>
  );
}
