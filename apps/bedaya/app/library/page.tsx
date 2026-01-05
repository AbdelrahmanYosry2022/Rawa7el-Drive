// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { 
  FolderOpen, 
  FileText, 
  Video, 
  Music, 
  Image as ImageIcon, 
  File,
  Presentation,
  Search,
  Grid,
  List,
  Tag,
  Calendar,
  Download,
  Eye,
  ArrowLeft,
  Loader2,
  BookOpen
} from 'lucide-react';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string | null;
  tags: string[] | null;
  createdAt: string;
  lectureTitle?: string;
}

const FILE_TYPE_ICONS: Record<string, any> = {
  PDF: FileText,
  DOCUMENT: FileText,
  POWERPOINT: Presentation,
  VIDEO: Video,
  AUDIO: Music,
  IMAGE: ImageIcon,
  OTHER: File,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-600',
  DOCUMENT: 'bg-blue-100 text-blue-600',
  POWERPOINT: 'bg-orange-100 text-orange-600',
  VIDEO: 'bg-purple-100 text-purple-600',
  AUDIO: 'bg-green-100 text-green-600',
  IMAGE: 'bg-pink-100 text-pink-600',
  OTHER: 'bg-slate-100 text-slate-600',
};

const CATEGORIES = [
  { id: 'all', name: 'جميع المواد', color: '#6366F1' },
  { id: 'quran', name: 'القرآن الكريم', color: '#10B981' },
  { id: 'tajweed', name: 'التجويد', color: '#F59E0B' },
  { id: 'fiqh', name: 'الفقه', color: '#8B5CF6' },
  { id: 'hadith', name: 'الحديث', color: '#EC4899' },
  { id: 'seerah', name: 'السيرة', color: '#0EA5E9' },
  { id: 'aqeedah', name: 'العقيدة', color: '#EF4444' },
  { id: 'arabic', name: 'اللغة العربية', color: '#14B8A6' },
  { id: 'other', name: 'أخرى', color: '#64748B' },
];

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

export default function LibraryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Material')
        .select(`
          *,
          CalendarEventMaterial (
            CalendarEvent (
              title
            )
          )
        `)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      const materialsWithLectures = (data || []).map((m: any) => ({
        ...m,
        lectureTitle: m.CalendarEventMaterial?.[0]?.CalendarEvent?.title || null,
      }));

      setMaterials(materialsWithLectures);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (materialId: string, category: string) => {
    try {
      const { error } = await supabase
        .from('Material')
        .update({ category })
        .eq('id', materialId);

      if (error) throw error;

      setMaterials(prev => 
        prev.map(m => m.id === materialId ? { ...m, category } : m)
      );
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCounts = () => {
    const counts: Record<string, number> = { all: materials.length };
    materials.forEach(m => {
      const cat = m.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50" dir="rtl">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">مكتبة المواد</h1>
                  <p className="text-xs text-slate-500">تصفح وتنظيم المواد التعليمية</p>
                </div>
              </div>
            </div>

            <Link href="/lectures">
              <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white">
                <BookOpen className="w-4 h-4 ml-2" />
                إدارة المحاضرات
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Categories */}
          <aside className="w-64 flex-shrink-0 hidden md:block">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  التصنيفات
                </h3>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-amber-100 text-amber-700'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.name}</span>
                      </div>
                      <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">
                        {categoryCounts[cat.id] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Search & View Toggle */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="البحث في المواد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-amber-100 text-amber-600' : 'text-slate-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-amber-100 text-amber-600' : 'text-slate-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Categories */}
            <div className="md:hidden mb-4 overflow-x-auto">
              <div className="flex gap-2 pb-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredMaterials.length === 0 && (
              <div className="text-center py-20">
                <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد مواد</h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery ? 'لم يتم العثور على نتائج للبحث' : 'لم يتم إضافة أي مواد بعد'}
                </p>
                <Link href="/lectures">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                    إضافة مواد من المحاضرات
                  </Button>
                </Link>
              </div>
            )}

            {/* Materials Grid */}
            {!loading && filteredMaterials.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map(material => {
                  const Icon = FILE_TYPE_ICONS[material.type] || File;
                  const colorClass = FILE_TYPE_COLORS[material.type] || FILE_TYPE_COLORS.OTHER;
                  const category = CATEGORIES.find(c => c.id === material.category);

                  return (
                    <Card key={material.id} className="group hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">{material.title}</h4>
                            <p className="text-xs text-slate-500">{formatFileSize(material.fileSize)}</p>
                          </div>
                        </div>

                        {material.lectureTitle && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                            <Calendar className="w-3 h-3" />
                            <span className="truncate">{material.lectureTitle}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <select
                            value={material.category || 'other'}
                            onChange={(e) => updateCategory(material.id, e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1"
                          >
                            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>

                          <div className="flex gap-1">
                            <a
                              href={material.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded hover:bg-slate-100"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </a>
                            <a
                              href={material.fileUrl}
                              download={material.fileName}
                              className="p-1.5 rounded hover:bg-slate-100"
                            >
                              <Download className="w-4 h-4 text-slate-500" />
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Materials List */}
            {!loading && filteredMaterials.length > 0 && viewMode === 'list' && (
              <div className="space-y-2">
                {filteredMaterials.map(material => {
                  const Icon = FILE_TYPE_ICONS[material.type] || File;
                  const colorClass = FILE_TYPE_COLORS[material.type] || FILE_TYPE_COLORS.OTHER;

                  return (
                    <Card key={material.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900">{material.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{formatFileSize(material.fileSize)}</span>
                              <span>{formatDate(material.createdAt)}</span>
                              {material.lectureTitle && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {material.lectureTitle}
                                </span>
                              )}
                            </div>
                          </div>
                          <select
                            value={material.category || 'other'}
                            onChange={(e) => updateCategory(material.id, e.target.value)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1"
                          >
                            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-1">
                            <a
                              href={material.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded hover:bg-slate-100"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                            </a>
                            <a
                              href={material.fileUrl}
                              download={material.fileName}
                              className="p-2 rounded hover:bg-slate-100"
                            >
                              <Download className="w-4 h-4 text-slate-500" />
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
