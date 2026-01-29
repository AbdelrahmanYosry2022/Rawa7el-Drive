'use client';

import { useState, FormEvent, useTransition } from 'react';
import { createSubject } from '@/app/actions/teacher/subjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateSubjectModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      try {
        await createSubject({ title, description });
        setTitle('');
        setDescription('');
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
        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-4 h-4" />
        إنشاء مادة
      </Button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">إنشاء مادة جديدة</h3>
              <button
                type="button"
                onClick={() => !isPending && setOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor="subject-title">
                  عنوان المادة
                </label>
                <Input
                  id="subject-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                  placeholder="مثال: الفقه للمبتدئين"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor="subject-description">
                  وصف مختصر
                </label>
                <Input
                  id="subject-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                  placeholder="وصف يساعد الطلاب على فهم محتوى المادة"
                />
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
                  {isPending ? 'جاري الإنشاء...' : 'حفظ المادة'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
