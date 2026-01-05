// @ts-nocheck
'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@rawa7el/supabase/client';
import Link from 'next/link';
import { 
  ArrowRight,
  BookOpen, 
  User, 
  Calendar, 
  FileText, 
  Video,
  Music,
  Image as ImageIcon,
  File,
  Presentation,
  Edit2, 
  Trash2, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileName: string;
  fileSize: number;
  publicUrl: string | null;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  status: string;
}

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
  createdAt: string;
  instructor?: { id: string; name: string; email: string } | null;
  materials: Material[];
  schedules: CalendarEvent[];
}

const materialTypeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  PDF: { icon: FileText, color: 'text-red-600', bg: 'bg-red-100' },
  POWERPOINT: { icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-100' },
  DOCUMENT: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  AUDIO: { icon: Music, color: 'text-purple-600', bg: 'bg-purple-100' },
  VIDEO: { icon: Video, color: 'text-pink-600', bg: 'bg-pink-100' },
  IMAGE: { icon: ImageIcon, color: 'text-green-600', bg: 'bg-green-100' },
  OTHER: { icon: File, color: 'text-gray-600', bg: 'bg-gray-100' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(timeString: string | null): string {
  if (!timeString) return '';
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LectureDetailsPage({ params }: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = use(params);
  const supabase = createClient();
  
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLinkMaterialModal, setShowLinkMaterialModal] = useState(false);
  const [showLinkScheduleModal, setShowLinkScheduleModal] = useState(false);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'schedules'>('materials');

  useEffect(() => {
    fetchLecture();
    fetchAllMaterials();
    fetchAllEvents();
  }, [lectureId]);

  const fetchLecture = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/lectures/${lectureId}`);
      const data = await res.json();
      if (res.ok) {
        setLecture(data.lecture);
      }
    } catch (error) {
      console.error('Error fetching lecture:', error);
    }
    setIsLoading(false);
  };

  const fetchAllMaterials = async () => {
    try {
      const res = await fetch('/api/materials');
      const data = await res.json();
      if (res.ok) {
        setAllMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (res.ok) {
        setAllEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLinkMaterials = async () => {
    if (selectedMaterialIds.length === 0) return;
    
    setIsLinking(true);
    try {
      const res = await fetch(`/api/lectures/${lectureId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialIds: selectedMaterialIds }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'تم ربط المواد بنجاح');
        setShowLinkMaterialModal(false);
        setSelectedMaterialIds([]);
        fetchLecture();
      } else {
        showNotification('error', data.error || 'فشل في ربط المواد');
      }
    } catch (error) {
      showNotification('error', 'حدث خطأ غير متوقع');
    }
    setIsLinking(false);
  };

  const handleUnlinkMaterial = async (materialId: string) => {
    try {
      const res = await fetch(`/api/lectures/${lectureId}/materials?materialId=${materialId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showNotification('success', 'تم إلغاء ربط المادة');
        fetchLecture();
      } else {
        showNotification('error', 'فشل في إلغاء الربط');
      }
    } catch (error) {
      showNotification('error', 'حدث خطأ غير متوقع');
    }
  };

  const handleLinkSchedules = async () => {
    if (selectedEventIds.length === 0) return;
    
    setIsLinking(true);
    try {
      const res = await fetch(`/api/lectures/${lectureId}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: selectedEventIds }),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'تم ربط المواعيد بنجاح');
        setShowLinkScheduleModal(false);
        setSelectedEventIds([]);
        fetchLecture();
      } else {
        showNotification('error', data.error || 'فشل في ربط المواعيد');
      }
    } catch (error) {
      showNotification('error', 'حدث خطأ غير متوقع');
    }
    setIsLinking(false);
  };

  const handleUnlinkSchedule = async (eventId: string) => {
    try {
      const res = await fetch(`/api/lectures/${lectureId}/schedules?eventId=${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showNotification('success', 'تم إلغاء ربط الموعد');
        fetchLecture();
      } else {
        showNotification('error', 'فشل في إلغاء الربط');
      }
    } catch (error) {
      showNotification('error', 'حدث خطأ غير متوقع');
    }
  };

  const toggleMaterialSelection = (id: string) => {
    setSelectedMaterialIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleEventSelection = (id: string) => {
    setSelectedEventIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filter out already linked items
  const availableMaterials = allMaterials.filter(
    m => !lecture?.materials.some(lm => lm.id === m.id)
  );
  const availableEvents = allEvents.filter(
    e => !lecture?.schedules.some(ls => ls.id === e.id)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">المحاضرة غير موجودة</h2>
          <Link href="/lectures" className="text-indigo-600 hover:underline">
            العودة للمحاضرات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
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

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/lectures" 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{lecture.title}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  lecture.isPublished 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {lecture.isPublished ? 'منشورة' : 'مسودة'}
                </span>
              </div>
              {lecture.description && (
                <p className="text-gray-500 mt-1">{lecture.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Lecture Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              {/* Thumbnail */}
              <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                {lecture.thumbnailUrl ? (
                  <img src={lecture.thumbnailUrl} alt={lecture.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-20 h-20 text-white/50" />
                )}
              </div>

              <div className="p-6 space-y-6">
                {/* Instructor */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">المحاضر</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {lecture.instructorName || lecture.instructor?.name || 'غير محدد'}
                      </p>
                      {lecture.instructorBio && (
                        <p className="text-sm text-gray-500 line-clamp-2">{lecture.instructorBio}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <FileText className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{lecture.materials.length}</p>
                    <p className="text-sm text-gray-500">مادة تعليمية</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{lecture.schedules.length}</p>
                    <p className="text-sm text-gray-500">موعد</p>
                  </div>
                </div>

                {lecture.duration && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5" />
                    <span>مدة المحاضرة: {lecture.duration} دقيقة</span>
                  </div>
                )}

                <Link
                  href={`/lectures`}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  تعديل المحاضرة
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex gap-2">
              <button
                onClick={() => setActiveTab('materials')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'materials'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-5 h-5" />
                المواد التعليمية ({lecture.materials.length})
              </button>
              <button
                onClick={() => setActiveTab('schedules')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === 'schedules'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-5 h-5" />
                المواعيد ({lecture.schedules.length})
              </button>
            </div>

            {/* Materials Tab */}
            {activeTab === 'materials' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">المواد التعليمية</h2>
                  <button
                    onClick={() => setShowLinkMaterialModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    ربط مادة
                  </button>
                </div>

                {lecture.materials.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد مواد مرتبطة بهذه المحاضرة</p>
                    <button
                      onClick={() => setShowLinkMaterialModal(true)}
                      className="mt-4 text-indigo-600 hover:underline"
                    >
                      ربط مادة الآن
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {lecture.materials.map((material) => {
                      const config = materialTypeConfig[material.type] || materialTypeConfig.OTHER;
                      const Icon = config.icon;
                      return (
                        <div key={material.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                          <div className={`p-3 rounded-xl ${config.bg}`}>
                            <Icon className={`w-6 h-6 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{material.title}</p>
                            <p className="text-sm text-gray-500">
                              {material.fileName} • {formatFileSize(material.fileSize)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {material.publicUrl && (
                              <a
                                href={material.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleUnlinkMaterial(material.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="إلغاء الربط"
                            >
                              <Unlink className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Schedules Tab */}
            {activeTab === 'schedules' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">مواعيد المحاضرة</h2>
                  <button
                    onClick={() => setShowLinkScheduleModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    ربط موعد
                  </button>
                </div>

                {lecture.schedules.length === 0 ? (
                  <div className="p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد مواعيد مرتبطة بهذه المحاضرة</p>
                    <button
                      onClick={() => setShowLinkScheduleModal(true)}
                      className="mt-4 text-indigo-600 hover:underline"
                    >
                      ربط موعد الآن
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {lecture.schedules.map((event) => (
                      <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                        <div className="p-3 rounded-xl bg-purple-100">
                          <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(event.date)}
                            {event.startTime && ` • ${formatTime(event.startTime)}`}
                            {event.endTime && ` - ${formatTime(event.endTime)}`}
                          </p>
                          {event.location && (
                            <p className="text-sm text-gray-400">{event.location}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            event.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {event.status === 'COMPLETED' ? 'مكتملة' :
                             event.status === 'CANCELLED' ? 'ملغية' : 'مجدولة'}
                          </span>
                          <button
                            onClick={() => handleUnlinkSchedule(event.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="إلغاء الربط"
                          >
                            <Unlink className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Material Modal */}
      {showLinkMaterialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">ربط مواد تعليمية</h2>
                <button
                  onClick={() => {
                    setShowLinkMaterialModal(false);
                    setSelectedMaterialIds([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {availableMaterials.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">لا توجد مواد متاحة للربط</p>
                  <Link href="/materials" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
                    رفع مواد جديدة
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableMaterials.map((material) => {
                    const isSelected = selectedMaterialIds.includes(material.id);
                    const config = materialTypeConfig[material.type] || materialTypeConfig.OTHER;
                    const Icon = config.icon;
                    return (
                      <button
                        key={material.id}
                        onClick={() => toggleMaterialSelection(material.id)}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 transition-colors ${
                          isSelected 
                            ? 'bg-indigo-100 border-2 border-indigo-500' 
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500' : config.bg}`}>
                          {isSelected ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          )}
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-medium text-gray-900">{material.title}</p>
                          <p className="text-sm text-gray-500">{material.fileName}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {availableMaterials.length > 0 && (
              <div className="p-6 border-t border-gray-100 space-y-3">
                {selectedMaterialIds.length > 0 && (
                  <p className="text-sm text-indigo-600 font-medium text-center">
                    تم اختيار {selectedMaterialIds.length} مادة
                  </p>
                )}
                <button
                  onClick={handleLinkMaterials}
                  disabled={selectedMaterialIds.length === 0 || isLinking}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLinking ? 'جاري الربط...' : 'ربط المواد المختارة'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Schedule Modal */}
      {showLinkScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">ربط مواعيد</h2>
                <button
                  onClick={() => {
                    setShowLinkScheduleModal(false);
                    setSelectedEventIds([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {availableEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">لا توجد مواعيد متاحة للربط</p>
                  <Link href="/calendar" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
                    إضافة موعد جديد
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableEvents.map((event) => {
                    const isSelected = selectedEventIds.includes(event.id);
                    return (
                      <button
                        key={event.id}
                        onClick={() => toggleEventSelection(event.id)}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 transition-colors ${
                          isSelected 
                            ? 'bg-indigo-100 border-2 border-indigo-500' 
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500' : 'bg-purple-100'}`}>
                          {isSelected ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Calendar className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {availableEvents.length > 0 && (
              <div className="p-6 border-t border-gray-100 space-y-3">
                {selectedEventIds.length > 0 && (
                  <p className="text-sm text-indigo-600 font-medium text-center">
                    تم اختيار {selectedEventIds.length} موعد
                  </p>
                )}
                <button
                  onClick={handleLinkSchedules}
                  disabled={selectedEventIds.length === 0 || isLinking}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLinking ? 'جاري الربط...' : 'ربط المواعيد المختارة'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
