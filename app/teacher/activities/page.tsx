'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClipboardList,
  FileEdit,
  Briefcase,
  BookOpen,
  PenTool,
  File,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  Search,
  FolderOpen,
  X,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Activity {
  id: string;
  title: string;
  description: string | null;
  type: 'WORKSHEET' | 'PROJECT' | 'ASSIGNMENT' | 'PRACTICE' | 'READING' | 'OTHER';
  content: string | null;
  attachments: string[] | null;
  subjectId: string;
  subject: {
    id: string;
    title: string;
    color: string | null;
  };
  dueDate: string | null;
  createdAt: string;
}

interface Subject {
  id: string;
  title: string;
  color: string | null;
}

const activityTypeIcons = {
  WORKSHEET: FileEdit,
  PROJECT: Briefcase,
  ASSIGNMENT: ClipboardList,
  PRACTICE: PenTool,
  READING: BookOpen,
  OTHER: File,
};

const activityTypeLabels = {
  WORKSHEET: 'ورقة عمل',
  PROJECT: 'مشروع',
  ASSIGNMENT: 'واجب',
  PRACTICE: 'تدريب',
  READING: 'قراءة',
  OTHER: 'نشاط آخر',
};

const activityTypeColors = {
  WORKSHEET: { bg: 'bg-blue-50', text: 'text-blue-600' },
  PROJECT: { bg: 'bg-purple-50', text: 'text-purple-600' },
  ASSIGNMENT: { bg: 'bg-amber-50', text: 'text-amber-600' },
  PRACTICE: { bg: 'bg-green-50', text: 'text-green-600' },
  READING: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  OTHER: { bg: 'bg-slate-50', text: 'text-slate-600' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export default function TeacherActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ASSIGNMENT' as Activity['type'],
    content: '',
    subjectId: '',
    dueDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [activitiesRes, subjectsRes] = await Promise.all([
        fetch('/api/activities'),
        fetch('/api/subjects'),
      ]);
      
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data);
      }
      
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingActivity 
        ? `/api/activities/${editingActivity.id}` 
        : '/api/activities';
      
      const res = await fetch(url, {
        method: editingActivity ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
        }),
      });

      if (res.ok) {
        await fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا النشاط؟')) return;

    try {
      const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActivities(activities.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  }

  function openModal(activity?: Activity) {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        title: activity.title,
        description: activity.description || '',
        type: activity.type,
        content: activity.content || '',
        subjectId: activity.subjectId,
        dueDate: activity.dueDate ? activity.dueDate.split('T')[0] : '',
      });
    } else {
      setEditingActivity(null);
      setFormData({
        title: '',
        description: '',
        type: 'ASSIGNMENT',
        content: '',
        subjectId: subjects[0]?.id || '',
        dueDate: '',
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingActivity(null);
    setFormData({
      title: '',
      description: '',
      type: 'ASSIGNMENT',
      content: '',
      subjectId: '',
      dueDate: '',
    });
  }

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !filterSubject || a.subjectId === filterSubject;
    return matchesSearch && matchesSubject;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher" className="text-slate-400 hover:text-slate-600">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إدارة الأنشطة والواجبات</h1>
            <p className="text-sm text-slate-500 mt-1">{activities.length} نشاط</p>
          </div>
        </div>
        <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 ml-2" />
          إضافة نشاط جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="البحث في الأنشطة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">جميع المواد</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">لا توجد أنشطة</p>
          <p className="text-slate-400 text-sm mt-1">اضغط على "إضافة نشاط جديد" للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => {
            const Icon = activityTypeIcons[activity.type];
            const colors = activityTypeColors[activity.type];
            const label = activityTypeLabels[activity.type];
            const isOverdue = activity.dueDate && new Date() > new Date(activity.dueDate);
            
            return (
              <Card 
                key={activity.id} 
                className={`bg-white border rounded-xl ${isOverdue ? 'border-red-200' : 'border-slate-100'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 line-clamp-1">
                        {activity.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activity.subject.title}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                        {label}
                      </span>
                      {activity.dueDate && (
                        <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(activity.dueDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(activity)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingActivity ? 'تعديل النشاط' : 'إضافة نشاط جديد'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  عنوان النشاط *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="مثال: واجب الفصل الثاني"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="وصف مختصر للنشاط..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    نوع النشاط *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Activity['type'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="ASSIGNMENT">واجب</option>
                    <option value="WORKSHEET">ورقة عمل</option>
                    <option value="PROJECT">مشروع</option>
                    <option value="PRACTICE">تدريب</option>
                    <option value="READING">قراءة</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    المادة *
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">اختر المادة</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  تاريخ التسليم
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  التعليمات والمحتوى
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="تعليمات النشاط أو المحتوى المطلوب..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? 'جاري الحفظ...' : editingActivity ? 'حفظ التعديلات' : 'إضافة النشاط'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
