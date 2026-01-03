'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Video, 
  Music, 
  Image as ImageIcon, 
  FileSpreadsheet,
  Link as LinkIcon,
  File,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  Search,
  FolderOpen,
  X
} from 'lucide-react';
import { Button } from '@rawa7el/ui/button';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Input } from '@rawa7el/ui/input';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' | 'LINK' | 'OTHER';
  url: string;
  fileSize: number | null;
  subjectId: string;
  subject: {
    id: string;
    title: string;
    color: string | null;
  };
  createdAt: string;
}

interface Subject {
  id: string;
  title: string;
  color: string | null;
}

const resourceTypeIcons = {
  PDF: FileText,
  VIDEO: Video,
  AUDIO: Music,
  IMAGE: ImageIcon,
  DOCUMENT: FileSpreadsheet,
  LINK: LinkIcon,
  OTHER: File,
};

const resourceTypeLabels = {
  PDF: 'ملف PDF',
  VIDEO: 'فيديو',
  AUDIO: 'صوت',
  IMAGE: 'صورة',
  DOCUMENT: 'مستند',
  LINK: 'رابط',
  OTHER: 'ملف آخر',
};

const resourceTypeColors = {
  PDF: { bg: 'bg-red-50', text: 'text-red-600' },
  VIDEO: { bg: 'bg-purple-50', text: 'text-purple-600' },
  AUDIO: { bg: 'bg-blue-50', text: 'text-blue-600' },
  IMAGE: { bg: 'bg-green-50', text: 'text-green-600' },
  DOCUMENT: { bg: 'bg-amber-50', text: 'text-amber-600' },
  LINK: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  OTHER: { bg: 'bg-slate-50', text: 'text-slate-600' },
};

export default function TeacherResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PDF' as Resource['type'],
    url: '',
    subjectId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [resourcesRes, subjectsRes] = await Promise.all([
        fetch('/api/resources'),
        fetch('/api/subjects'),
      ]);
      
      if (resourcesRes.ok) {
        const data = await resourcesRes.json();
        setResources(data);
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
      const url = editingResource 
        ? `/api/resources/${editingResource.id}` 
        : '/api/resources';
      
      const res = await fetch(url, {
        method: editingResource ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving resource:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;

    try {
      const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResources(resources.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  }

  function openModal(resource?: Resource) {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        title: resource.title,
        description: resource.description || '',
        type: resource.type,
        url: resource.url,
        subjectId: resource.subjectId,
      });
    } else {
      setEditingResource(null);
      setFormData({
        title: '',
        description: '',
        type: 'PDF',
        url: '',
        subjectId: subjects[0]?.id || '',
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      type: 'PDF',
      url: '',
      subjectId: '',
    });
  }

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !filterSubject || r.subjectId === filterSubject;
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
            <h1 className="text-2xl font-bold text-slate-900">إدارة الملفات والموارد</h1>
            <p className="text-sm text-slate-500 mt-1">{resources.length} ملف</p>
          </div>
        </div>
        <Button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 ml-2" />
          إضافة ملف جديد
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="البحث في الملفات..."
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

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">لا توجد ملفات</p>
          <p className="text-slate-400 text-sm mt-1">اضغط على "إضافة ملف جديد" للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => {
            const Icon = resourceTypeIcons[resource.type];
            const colors = resourceTypeColors[resource.type];
            const label = resourceTypeLabels[resource.type];
            
            return (
              <Card key={resource.id} className="bg-white border border-slate-100 rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-slate-900 line-clamp-1">
                        {resource.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {resource.subject.title}
                      </p>
                      {resource.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(resource)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resource.id)}
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
                {editingResource ? 'تعديل الملف' : 'إضافة ملف جديد'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  عنوان الملف *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="مثال: ملخص الفصل الأول"
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
                  rows={3}
                  placeholder="وصف مختصر للملف..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    نوع الملف *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource['type'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="PDF">ملف PDF</option>
                    <option value="VIDEO">فيديو</option>
                    <option value="AUDIO">صوت</option>
                    <option value="IMAGE">صورة</option>
                    <option value="DOCUMENT">مستند</option>
                    <option value="LINK">رابط</option>
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
                  رابط الملف *
                </label>
                <Input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                  placeholder="https://..."
                  dir="ltr"
                />
                <p className="text-xs text-slate-400 mt-1">
                  يمكنك رفع الملف على Google Drive أو Dropbox ولصق الرابط هنا
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting ? 'جاري الحفظ...' : editingResource ? 'حفظ التعديلات' : 'إضافة الملف'}
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
