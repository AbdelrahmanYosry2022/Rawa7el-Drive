'use client';

import { useState, useTransition } from 'react';
import { addQuestionsBulk } from '@/app/actions/teacher/exams';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';

interface BulkImportDialogProps {
  examId: string;
  onSuccess: () => void;
}

export function BulkImportDialog({ examId, onSuccess }: BulkImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const exampleJson = `[
  {
    "text": "ما هي عاصمة مصر؟",
    "type": "MCQ",
    "options": ["القاهرة", "الإسكندرية", "الجيزة", "أسوان"],
    "correctAnswer": "القاهرة",
    "points": 10
  },
  {
    "text": "الأرض كروية الشكل",
    "type": "TRUE_FALSE",
    "correctAnswer": "صحيح",
    "points": 5
  }
]`;

  const handleImport = () => {
    setError('');
    
    if (!jsonInput.trim()) {
      setError('الرجاء إدخال JSON');
      return;
    }

    startTransition(async () => {
      try {
        const result = await addQuestionsBulk(examId, jsonInput);
        
        if (result.success) {
          alert(`تم إضافة ${result.count} سؤال بنجاح! ✅`);
          setJsonInput('');
          setIsOpen(false);
          onSuccess();
        } else {
          setError(result.error || 'فشل الاستيراد');
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع');
      }
    });
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Upload className="w-4 h-4" />
        استيراد JSON
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">استيراد أسئلة من JSON</h2>
              <p className="text-xs text-slate-500 mt-1">
                الصق كود JSON للأسئلة وسيتم إضافتها دفعة واحدة
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Example Format */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700">مثال على الصيغة المطلوبة:</p>
            <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] overflow-x-auto text-left" dir="ltr">
              {exampleJson}
            </pre>
            <div className="text-[10px] text-slate-500 space-y-1">
              <p>• <strong>type</strong>: يجب أن يكون <code className="bg-slate-100 px-1 rounded">MCQ</code> أو <code className="bg-slate-100 px-1 rounded">TRUE_FALSE</code></p>
              <p>• <strong>options</strong>: مطلوب فقط لـ MCQ (على الأقل خيارين)</p>
              <p>• <strong>correctAnswer</strong>: يجب أن يكون أحد الخيارات (أو "صحيح"/"خطأ" لـ TRUE_FALSE)</p>
              <p>• <strong>points</strong>: اختياري (القيمة الافتراضية: 10)</p>
            </div>
          </div>

          {/* JSON Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">
              الصق JSON هنا:
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="الصق كود JSON للأسئلة..."
              className="w-full h-64 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              dir="ltr"
              disabled={isPending}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              ❌ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={isPending || !jsonInput.trim()}
              className="gap-2"
            >
              {isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  جاري الاستيراد...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  استيراد الأسئلة
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
