// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@rawa7el/supabase/client';
import Link from 'next/link';
import { 
  Plus, 
  BookOpen, 
  User, 
  Calendar, 
  FileText, 
  Edit2, 
  Trash2, 
  Eye,
  Search,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  GraduationCap
} from 'lucide-react';

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  instructorId: string | null;
  instructorName: string | null;
  instructorBio: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  isPublished: boolean;
  order: number;
  createdAt: string;
  instructor?: { id: string; name: string; email: string } | null;
  materialsCount: number;
  schedulesCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function LecturesPage() {
  const supabase = createClient();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructorId: '',
    instructorName: '',
    instructorBio: '',
    duration: '',
    isPublished: false,
  });

  useEffect(() => {
    fetchLectures();
    fetchUsers();
  }, []);

  const fetchLectures = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/lectures');
      const data = await res.json();
      if (res.ok) {
        setLectures(data.lectures || []);
      }
    } catch (error) {
      console.error('Error fetching lectures:', error);
    }
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data } = await (supabase as any)
        .from('User')
        .select('id, name, email')
        .eq('platform', 'BEDAYA')
        .order('name');
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingLecture 
        ? `/api/lectures/${editingLecture.id}` 
        : '/api/lectures';
      
      const res = await fetch(url, {
        method: editingLecture ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('success', editingLecture ? 'تم تحديث المحاضرة بنجاح' : 'تم إنشاء المحاضرة بنجاح');
        setShowModal(false);
        setEditingLecture(null);
        resetForm();
        fetchLectures();
      } else {
        showNotification('error', data.error || 'حدث خطأ');
      }
    } catch (error) {
      showNotification('error', 'حدث خطأ غير متوقع');
    }
  };

  const handleDelete = async (lecture: Lecture) => {
    if (!confirm(`هل أنت متأكد من حذف المحاضرة "${lecture.title}"؟`)) return;

    try {
      const res = await fetch(`/api/lectures/${lecture.id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'تم حذف المحاضرة بنجاح');
        fetchLectures();
      } else {
        showNotification('error', 'فشل في حذف المحاضرة');
      }
    } catch (error) {
      showNotification('error', 'حدث خطأ غير متوقع');
    }
  };

  const openEditModal = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setFormData({
      title: lecture.title,
      description: lecture.description || '',
      instructorId: lecture.instructorId || '',
      instructorName: lecture.instructorName || '',
      instructorBio: lecture.instructorBio || '',
      duration: lecture.duration?.toString() || '',
      isPublished: lecture.isPublished,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructorId: '',
      instructorName: '',
      instructorBio: '',
      duration: '',
      isPublished: false,
    });
  };

  const filteredLectures = lectures.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.instructorName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  إدارة المحاضرات
                </h1>
                <p className="text-gray-500 text-sm mt-1">إنشاء وإدارة المحاضرات وربطها بالمواد والمواعيد</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingLecture(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              إضافة محاضرة
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="flex-1">{notification.message}</span>
        </div>
      )}

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="البحث في المحاضرات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : filteredLectures.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد محاضرات</h3>
            <p className="text-gray-500 mb-6">ابدأ بإضافة محاضرة جديدة</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              إضافة محاضرة
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredLectures.map((lecture) => (
              <div
                key={lecture.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                {/* Thumbnail */}
                <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                  {lecture.thumbnailUrl ? (
                    <img 
                      src={lecture.thumbnailUrl} 
                      alt={lecture.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  
                  {/* Status badge */}
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                    lecture.isPublished 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-800/70 text-white'
                  }`}>
                    {lecture.isPublished ? 'منشورة' : 'مسودة'}
                  </div>

                  {/* Actions */}
                  <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(lecture)}
                      className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDelete(lecture)}
                      className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                    {lecture.title}
                  </h3>
                  
                  {lecture.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {lecture.description}
                    </p>
                  )}

                  {/* Instructor */}
                  {(lecture.instructorName || lecture.instructor) && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        {lecture.instructorName || lecture.instructor?.name}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{lecture.materialsCount} مادة</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{lecture.schedulesCount} موعد</span>
                    </div>
                    {lecture.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{lecture.duration} د</span>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <Link
                    href={`/lectures/${lecture.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-xl transition-colors font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    عرض التفاصيل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingLecture ? 'تعديل المحاضرة' : 'إضافة محاضرة جديدة'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingLecture(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان المحاضرة *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="أدخل عنوان المحاضرة"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="وصف مختصر للمحاضرة"
                />
              </div>

              {/* Instructor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر المحاضر من المستخدمين
                </label>
                <select
                  value={formData.instructorId}
                  onChange={(e) => {
                    const selectedUser = users.find(u => u.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      instructorId: e.target.value,
                      instructorName: selectedUser?.name || formData.instructorName
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- اختر محاضر --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Instructor Name (manual) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  أو أدخل اسم المحاضر يدوياً
                </label>
                <input
                  type="text"
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="اسم المحاضر"
                />
              </div>

              {/* Instructor Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نبذة عن المحاضر
                </label>
                <textarea
                  value={formData.instructorBio}
                  onChange={(e) => setFormData({ ...formData, instructorBio: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="نبذة مختصرة عن المحاضر"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مدة المحاضرة (بالدقائق)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="60"
                  min="1"
                />
              </div>

              {/* Published */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                  نشر المحاضرة (ستظهر للطلاب)
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
              >
                {editingLecture ? 'حفظ التغييرات' : 'إنشاء المحاضرة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
