import { useState, useEffect, useRef } from 'react';
import * as tus from 'tus-js-client';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  File,
  Presentation,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Download,
  BookOpen
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
  category: string | null;
  platform: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

const materialTypeConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  PDF: { icon: FileText, color: 'text-red-600', bgColor: 'bg-red-50', label: 'PDF' },
  POWERPOINT: { icon: Presentation, color: 'text-orange-600', bgColor: 'bg-orange-50', label: 'عرض تقديمي' },
  DOCUMENT: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'مستند Word' },
  OTHER: { icon: File, color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'أخرى' },
};

function getFileType(mimeType: string, fileName: string): string {
  if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) return 'PDF';
  if (
    mimeType.includes('powerpoint') ||
    mimeType.includes('presentation') ||
    fileName.endsWith('.pptx') ||
    fileName.endsWith('.ppt')
  )
    return 'POWERPOINT';
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.doc')
  )
    return 'DOCUMENT';
  return 'OTHER';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx';
const ACCEPTED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const tusUploadRef = useRef<tus.Upload|null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('Material')
        .select('*')
        .order('createdAt', { ascending: false });

      if (filterType) {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      showNotification('error', 'فشل في تحميل المواد');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [filterType]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIME.includes(file.type) && !file.name.match(/\.(pdf|docx?|pptx?)$/i)) {
      showNotification('error', 'نوع الملف غير مدعوم. الأنواع المدعومة: PDF, Word, PowerPoint');
      return;
    }

    setUploadFile(file);
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const uploadWithTus = (file: File, storagePath: string, token: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const projectId = supabaseUrl.replace('https://','').split('.')[0];
      const upload = new tus.Upload(file, {
        endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${token}`,
          'x-upsert': 'false',
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: 'bedaya-materials',
          objectName: storagePath,
          contentType: file.type,
          cacheControl: '3600',
        },
        chunkSize: 6 * 1024 * 1024,
        onError: function (error) {
          tusUploadRef.current = null;
          reject(error);
        },
        onProgress: function (bytesUploaded, bytesTotal) {
          const pct = Math.round((bytesUploaded / bytesTotal) * 90);
          setUploadProgress(5 + pct);
        },
        onSuccess: function () {
          tusUploadRef.current = null;
          resolve();
        },
      });
      tusUploadRef.current = upload;
      upload.findPreviousUploads().then((prev) => {
        if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
        upload.start();
      });
    });
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setUploadProgress(0);
  };

  const cancelUpload = () => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort(true);
      tusUploadRef.current = null;
    }
    setIsUploading(false); setUploadProgress(0);
    setShowUploadModal(false);
    resetUploadForm();
  };

  const closeUploadModal = cancelUpload;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) return;

    setIsUploading(true);
    setUploadProgress(2);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        showNotification('error', 'يجب تسجيل الدخول أولاً');
        setIsUploading(false);
        return;
      }
      const user = session.user;
      setUploadProgress(5);

      // Generate unique file path
      const timestamp = Date.now();
      const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `materials/${user.id}/${timestamp}_${safeName}`;

      // Upload with TUS resumable protocol (supports large files)
      await uploadWithTus(uploadFile, storagePath, session.access_token);
      setUploadProgress(95);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bedaya-materials')
        .getPublicUrl(storagePath);

      const publicUrl = urlData?.publicUrl || null;
      setUploadProgress(97);

      // Determine file type
      const fileType = getFileType(uploadFile.type, uploadFile.name);

      // Insert into Material table
      const { error: insertError } = await supabase
        .from('Material')
        .insert({
          title: uploadTitle.trim(),
          description: uploadDescription.trim() || null,
          type: fileType,
          fileName: uploadFile.name,
          fileSize: uploadFile.size,
          mimeType: uploadFile.type,
          storagePath,
          publicUrl,
          uploadedBy: user.id,
        });

      if (insertError) throw insertError;

      setUploadProgress(100);
      showNotification('success', 'تم رفع الملف بنجاح');
      setShowUploadModal(false);
      resetUploadForm();
      fetchMaterials();
    } catch (error: any) {
      if (error?.message !== 'cancelled' && error?.toString?.() !== 'tus: upload has been aborted') {
        console.error('Error uploading:', error);
        showNotification('error', error?.message || 'حدث خطأ أثناء رفع الملف');
      }
    } finally {
      tusUploadRef.current = null;
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (material: Material) => {
    if (!confirm(`هل أنت متأكد من حذف "${material.title}"؟`)) return;

    try {
      // Delete from storage
      if (material.storagePath) {
        await supabase.storage.from('bedaya-materials').remove([material.storagePath]);
      }

      // Delete from DB
      const { error } = await supabase
        .from('Material')
        .delete()
        .eq('id', material.id);

      if (error) throw error;

      showNotification('success', 'تم حذف الملف بنجاح');
      setMaterials(prev => prev.filter(m => m.id !== material.id));
    } catch (error: any) {
      console.error('Error deleting:', error);
      showNotification('error', error?.message || 'حدث خطأ أثناء حذف الملف');
    }
  };

  const handleDownload = (material: Material) => {
    if (material.publicUrl) {
      window.open(material.publicUrl, '_blank');
    }
  };

  const filteredMaterials = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all group border border-slate-200"
            >
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                مكتبة المواد
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">{materials.length} ملف مرفوع</p>
            </div>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl shadow-lg shadow-indigo-200 font-bold"
          >
            <Upload className="w-4 h-4" />
            رفع مادة جديدة
          </Button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="flex-1 text-sm font-bold">{notification.message}</span>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="البحث في المواد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-right"
              />
            </div>

            <div className="relative">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pr-10 pl-8 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white min-w-[160px]"
              >
                <option value="">جميع الأنواع</option>
                <option value="PDF">PDF</option>
                <option value="POWERPOINT">عروض تقديمية</option>
                <option value="DOCUMENT">مستندات Word</option>
              </select>
            </div>

            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-50 rounded-3xl flex items-center justify-center">
              <File className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-700 mb-2">لا توجد مواد</h3>
            <p className="text-slate-500 mb-6">ابدأ برفع الملفات والمواد التعليمية</p>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-2 font-bold"
            >
              <Upload className="w-5 h-5" />
              رفع مادة جديدة
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMaterials.map((material) => {
              const typeConfig = materialTypeConfig[material.type] || materialTypeConfig.OTHER;
              const TypeIcon = typeConfig.icon;

              return (
                <Card
                  key={material.id}
                  className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
                >
                  <div
                    className={`h-36 ${typeConfig.bgColor} flex items-center justify-center relative`}
                  >
                    <TypeIcon className={`w-16 h-16 ${typeConfig.color} opacity-40`} />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      {material.publicUrl && (
                        <button
                          onClick={() => handleDownload(material)}
                          className="p-3 bg-white rounded-full hover:bg-slate-100 transition-colors"
                          title="عرض / تحميل"
                        >
                          <Download className="w-5 h-5 text-slate-700" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(material)}
                        className="p-3 bg-white rounded-full hover:bg-red-50 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${typeConfig.bgColor} shrink-0`}>
                        <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 truncate text-sm">{material.title}</h3>
                        <p className="text-xs text-slate-500 truncate">{material.fileName}</p>
                      </div>
                    </div>
                    {material.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{material.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span>{formatFileSize(material.fileSize)}</span>
                      <span>{formatDate(material.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    الملف
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    الحجم
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMaterials.map((material) => {
                  const typeConfig = materialTypeConfig[material.type] || materialTypeConfig.OTHER;
                  const TypeIcon = typeConfig.icon;

                  return (
                    <tr key={material.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                            <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{material.title}</p>
                            <p className="text-xs text-slate-500">{material.fileName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${typeConfig.bgColor} ${typeConfig.color}`}
                        >
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {formatFileSize(material.fileSize)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {formatDate(material.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {material.publicUrl && (
                            <button
                              onClick={() => handleDownload(material)}
                              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                              title="عرض / تحميل"
                            >
                              <Download className="w-4 h-4 text-slate-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(material)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeUploadModal}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-slate-800">رفع مادة جديدة</h2>
              <button
                onClick={closeUploadModal}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  uploadFile
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                }`}
                onClick={() => document.getElementById('material-file-input')?.click()}
              >
                <input
                  type="file"
                  id="material-file-input"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept={ACCEPTED_TYPES}
                />
                {uploadFile ? (
                  <div className="space-y-2">
                    <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-indigo-600" />
                    </div>
                    <p className="font-bold text-slate-800">{uploadFile.name}</p>
                    <p className="text-sm text-slate-500">{formatFileSize(uploadFile.size)}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadFile(null);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-bold"
                    >
                      إزالة الملف
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700">اضغط لاختيار ملف أو اسحبه هنا</p>
                    <p className="text-sm text-slate-500">PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx)</p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  عنوان المادة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="مثال: ملخص محاضرة الأسبوع الثالث"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-right"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                  placeholder="أضف وصفاً للمادة..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-right resize-none"
                />
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-bold">جاري الرفع...</span>
                    <span className="text-indigo-600 font-black">{uploadProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-3 pt-2">
                {isUploading ? (
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-base shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    إلغاء الرفع
                  </button>
                ) : (
                  <>
                    <Button
                      type="submit"
                      disabled={!uploadFile || !uploadTitle.trim()}
                      className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-black text-base shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      رفع المادة
                    </Button>
                    <button
                      type="button"
                      onClick={closeUploadModal}
                      className="px-6 h-12 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
                    >
                      إلغاء
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
