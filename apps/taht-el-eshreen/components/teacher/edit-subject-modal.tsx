'use client';

import { useState, useTransition, FormEvent } from 'react';
import { updateSubject } from '@/app/actions/teacher/subjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditSubjectModalProps {
  subject: {
    id: string;
    title: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  };
}

export function EditSubjectModal({ subject }: EditSubjectModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(subject.title);
  const [description, setDescription] = useState(subject.description ?? '');
  const [icon, setIcon] = useState(subject.icon ?? '');
  const [color, setColor] = useState(subject.color ?? '');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      try {
        await updateSubject(subject.id, {
          title,
          description,
          icon,
          color,
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
        aria-label="تعديل المادة"
      >
        <Pencil className="w-4 h-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">تعديل المادة</h3>
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
                <label className="text-xs text-slate-500" htmlFor="subject-title-edit">
                  عنوان المادة
                </label>
                <Input
                  id="subject-title-edit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor="subject-description-edit">
                  وصف مختصر
                </label>
                <Input
                  id="subject-description-edit"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500" htmlFor="subject-icon-edit">
                    أيقونة (إيموجي)
                  </label>
                  <Input
                    id="subject-icon-edit"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                    placeholder="📘"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500" htmlFor="subject-color-edit">
                    لون (Hex)
                  </label>
                  <Input
                    id="subject-color-edit"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                    placeholder="#4f46e5"
                  />
                </div>
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
