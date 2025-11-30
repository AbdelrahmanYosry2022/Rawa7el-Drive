'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, FolderKanban } from 'lucide-react';
import { createSubject, deleteSubject } from '@/app/actions/teacher/subjects';

type Subject = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  _count: {
    exams: number;
  };
};

export function SubjectsList({ subjects: initialSubjects }: { subjects: Subject[] }) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    color: '#6366f1',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      alert('يرجى إدخال عنوان المادة');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createSubject(formData);
      if (result.success && result.subject) {
        setSubjects([{ ...result.subject, _count: { exams: 0 } }, ...subjects]);
        setFormData({ title: '', description: '', icon: '', color: '#6366f1' });
        setIsCreating(false);
      } else {
        alert(result.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الإنشاء');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع الاختبارات المرتبطة بها.')) {
      return;
    }

    try {
      const result = await deleteSubject(subjectId);
      if (result.success) {
        setSubjects(subjects.filter((s) => s.id !== subjectId));
      } else {
        alert(result.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Button */}
      {!isCreating && (
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          إضافة مادة جديدة
        </Button>
      )}

      {/* Create Form */}
      {isCreating && (
        <Card className="bg-white shadow-sm border-indigo-200">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">إضافة مادة جديدة</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">عنوان المادة *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: الفقه"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">الأيقونة (Emoji)</label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📖"
                  className="text-right"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">الوصف</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر للمادة"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">اللون</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1 text-right"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setFormData({ title: '', description: '', icon: '', color: '#6366f1' });
                }}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects List */}
      {subjects.length === 0 ? (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-12 text-center">
            <FolderKanban className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">لا توجد مواد دراسية حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={
                      subject.color
                        ? { backgroundColor: `${subject.color}20`, color: subject.color }
                        : { backgroundColor: '#e0e7ff', color: '#6366f1' }
                    }
                  >
                    {subject.icon || '📚'}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{subject.title}</h3>
                  {subject.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{subject.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">{subject._count.exams} اختبار</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
