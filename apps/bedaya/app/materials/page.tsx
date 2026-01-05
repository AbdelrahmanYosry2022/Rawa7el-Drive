// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@rawa7el/supabase/client';
import { 
  Upload, 
  FileText, 
  Video, 
  Music, 
  Image as ImageIcon, 
  File, 
  Presentation,
  Trash2, 
  Download, 
  Link as LinkIcon,
  Search,
  Filter,
  Grid,
  List,
  X,
  Plus,
  Calendar,
  Eye,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  publicUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  pageCount: number | null;
  platform: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  uploader?: { id: string; name: string };
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
}

const materialTypeConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  PDF: { icon: FileText, color: 'text-red-600', bgColor: 'bg-red-100', label: 'PDF' },
  POWERPOINT: { icon: Presentation, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'عرض تقديمي' },
  DOCUMENT: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'مستند' },
  AUDIO: { icon: Music, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'صوت' },
  VIDEO: { icon: Video, color: 'text-pink-600', bgColor: 'bg-pink-100', label: 'فيديو' },
  IMAGE: { icon: ImageIcon, color: 'text-green-600', bgColor: 'bg-green-100', label: 'صورة' },
  OTHER: { icon: File, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'أخرى' },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function MaterialsPage() {
  const supabase = createClient();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadEventId, setUploadEventId] = useState('');

  useEffect(() => {
    fetchMaterials();
    fetchEvents();
  }, [filterType]);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      let url = '/api/materials';
      if (filterType) {
        url += `?type=${filterType}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.materials) {
        setMaterials(data.materials);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      showNotification('error', 'فشل في تحميل المواد');
    }
    setIsLoading(false);
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      if (uploadEventId) {
        formData.append('eventId', uploadEventId);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const res = await fetch('/api/materials', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();

      if (res.ok) {
        showNotification('success', 'تم رفع الملف بنجاح');
        setShowUploadModal(false);
        resetUploadForm();
        fetchMaterials();
      } else {
        showNotification('error', data.error || 'فشل في رفع الملف');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      showNotification('error', 'حدث خطأ أثناء رفع الملف');
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadEventId('');
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`هل أنت متأكد من حذف "${material.title}"؟`)) return;

    try {
      const res = await fetch(`/api/materials/${material.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showNotification('success', 'تم حذف الملف بنجاح');
        fetchMaterials();
      } else {
        const data = await res.json();
        showNotification('error', data.error || 'فشل في حذف الملف');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showNotification('error', 'حدث خطأ أثناء حذف الملف');
    }
  };

  const handleLinkToEvent = async (eventId: string) => {
    if (!selectedMaterial) return;

    try {
      const res = await fetch(`/api/materials/${selectedMaterial.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('success', 'تم ربط الملف بالمحاضرة بنجاح');
        setShowLinkModal(false);
        setSelectedMaterial(null);
      } else {
        showNotification('error', data.error || 'فشل في ربط الملف');
      }
    } catch (error) {
      console.error('Error linking:', error);
      showNotification('error', 'حدث خطأ أثناء ربط الملف');
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    const config = materialTypeConfig[type] || materialTypeConfig.OTHER;
    const Icon = config.icon;
    return <Icon className={`w-6 h-6 ${config.color}`} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                مكتبة المواد التعليمية
              </h1>
              <p className="text-gray-500 text-sm mt-1">إدارة ورفع الملفات والمواد التعليمية</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Upload className="w-5 h-5" />
              رفع ملف جديد
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في المواد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter by type */}
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pr-10 pl-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
              >
                <option value="">جميع الأنواع</option>
                <option value="PDF">PDF</option>
                <option value="POWERPOINT">عروض تقديمية</option>
                <option value="DOCUMENT">مستندات</option>
                <option value="VIDEO">فيديو</option>
                <option value="AUDIO">صوت</option>
                <option value="IMAGE">صور</option>
              </select>
            </div>

            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Materials Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <File className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد مواد</h3>
            <p className="text-gray-500 mb-6">ابدأ برفع الملفات والمواد التعليمية</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              رفع ملف جديد
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMaterials.map((material) => {
              const typeConfig = materialTypeConfig[material.type] || materialTypeConfig.OTHER;
              const TypeIcon = typeConfig.icon;
              
              return (
                <div
                  key={material.id}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
                >
                  {/* Preview area */}
                  <div className={`h-40 ${typeConfig.bgColor} flex items-center justify-center relative`}>
                    {material.type === 'IMAGE' && material.publicUrl ? (
                      <img 
                        src={material.publicUrl} 
                        alt={material.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <TypeIcon className={`w-16 h-16 ${typeConfig.color} opacity-50`} />
                    )}
                    
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      {material.publicUrl && (
                        <a
                          href={material.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <Eye className="w-5 h-5 text-gray-700" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setSelectedMaterial(material);
                          setShowLinkModal(true);
                        }}
                        className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <LinkIcon className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={() => handleDelete(material)}
                        className="p-3 bg-white rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                        <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{material.title}</h3>
                        <p className="text-sm text-gray-500 truncate">{material.fileName}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      <span>{formatFileSize(material.fileSize)}</span>
                      <span>{formatDate(material.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">الملف</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">النوع</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">الحجم</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">التاريخ</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMaterials.map((material) => {
                  const typeConfig = materialTypeConfig[material.type] || materialTypeConfig.OTHER;
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                            <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{material.title}</p>
                            <p className="text-sm text-gray-500">{material.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(material.fileSize)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(material.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {material.publicUrl && (
                            <a
                              href={material.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSelectedMaterial(material);
                              setShowLinkModal(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <LinkIcon className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(material)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">رفع ملف جديد</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-6">
              {/* File drop zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                  uploadFile 
                    ? 'border-indigo-300 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.mp3,.mp4,.wav,.ogg,.webm,.jpg,.jpeg,.png,.gif,.webp"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploadFile ? (
                    <div className="space-y-2">
                      <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-indigo-600" />
                      </div>
                      <p className="font-medium text-gray-900">{uploadFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(uploadFile.size)}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadFile(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        إزالة الملف
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-700">اسحب الملف هنا أو اضغط للاختيار</p>
                      <p className="text-sm text-gray-500">PDF, PowerPoint, Word, صور, صوت, فيديو</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عنوان الملف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="أدخل عنوان الملف"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="أضف وصفاً للملف..."
                />
              </div>

              {/* Link to event */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ربط بمحاضرة (اختياري)
                </label>
                <select
                  value={uploadEventId}
                  onChange={(e) => setUploadEventId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- اختر محاضرة --</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {formatDate(event.date)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">جاري الرفع...</span>
                    <span className="text-indigo-600 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={!uploadFile || !uploadTitle || isUploading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {isUploading ? 'جاري الرفع...' : 'رفع الملف'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Link to Event Modal */}
      {showLinkModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">ربط بمحاضرة</h2>
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setSelectedMaterial(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                اختر المحاضرة التي تريد ربط الملف <strong>"{selectedMaterial.title}"</strong> بها:
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">لا توجد محاضرات متاحة</p>
                ) : (
                  events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => handleLinkToEvent(event.id)}
                      className="w-full p-4 text-right bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-3"
                    >
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
