import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Video, 
  Music, 
  Image as ImageIcon, 
  File, 
  Presentation,
  Download, 
  Search,
  Grid,
  List,
  Loader2,
  Eye
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
  createdAt: string;
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

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('Material')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m => 
    (m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     m.fileName.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterType === '' || m.type === filterType)
  );

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 md:p-8 space-y-4 md:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight mb-0.5 md:mb-2">المواد التعليمية</h1>
        <p className="text-slate-500 font-medium text-xs md:text-lg">تصفح وحمل المواد العلمية والمحاضرات</p>
      </div>

      {/* Filters & Search */}
      <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl shadow-sm overflow-hidden">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث في المواد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 md:py-3 bg-slate-50 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-slate-600 font-medium text-sm"
              />
            </div>

            <div className="flex gap-2 md:gap-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 md:flex-none pr-3 pl-8 py-2.5 md:py-3 bg-slate-50 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-slate-600 font-bold appearance-none text-sm md:min-w-[160px]"
              >
                <option value="">جميع الأنواع</option>
                <option value="PDF">PDF</option>
                <option value="POWERPOINT">عروض تقديمية</option>
                <option value="DOCUMENT">مستندات</option>
                <option value="VIDEO">فيديو</option>
                <option value="AUDIO">صوت</option>
                <option value="IMAGE">صور</option>
              </select>

              <div className="hidden md:flex bg-slate-50 rounded-2xl p-1 shadow-inner">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid/List */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 md:py-20 bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100">
          <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-slate-50 rounded-full flex items-center justify-center">
            <File className="w-8 h-8 md:w-12 md:h-12 text-slate-300" />
          </div>
          <h3 className="text-base md:text-xl font-black text-slate-800 mb-1 md:mb-2">لا توجد مواد تعليمية</h3>
          <p className="text-slate-500 font-medium text-sm">لم يتم رفع أي مواد في هذا القسم بعد.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {filteredMaterials.map((material) => {
            const typeConfig = materialTypeConfig[material.type] || materialTypeConfig.OTHER;
            const TypeIcon = typeConfig.icon;
            
            return (
              <Card key={material.id} className="group bg-white rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-100 transition-all duration-500">
                <CardContent className="p-0">
                  <div className={`h-28 md:h-40 ${typeConfig.bgColor} flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500`}>
                    {material.type === 'IMAGE' && material.publicUrl ? (
                      <img src={material.publicUrl} alt={material.title} className="w-full h-full object-cover" />
                    ) : (
                      <TypeIcon className={`w-16 h-16 ${typeConfig.color} opacity-40`} />
                    )}
                    
                    <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                      {material.publicUrl && (
                        <>
                          <a
                            href={material.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 bg-white rounded-2xl hover:bg-emerald-50 text-emerald-600 transition-all shadow-lg transform hover:scale-110"
                            title="عرض"
                          >
                            <Eye className="w-5 h-5" />
                          </a>
                          <a
                            href={material.publicUrl}
                            download={material.fileName}
                            className="p-3 bg-emerald-600 rounded-2xl hover:bg-emerald-700 text-white transition-all shadow-lg transform hover:scale-110"
                            title="تحميل"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3 md:p-6">
                    <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-4">
                      <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${typeConfig.bgColor} hidden md:block`}>
                        <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-800 truncate leading-tight mb-0.5 text-sm md:text-base">{material.title}</h3>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 truncate uppercase tracking-wider">{typeConfig.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 md:pt-4 border-t border-slate-50">
                      <span>{formatFileSize(material.fileSize)}</span>
                      <span>{new Date(material.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">الملف</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">النوع</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">الحجم</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">التاريخ</th>
                    <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMaterials.map((material) => {
                    const typeConfig = materialTypeConfig[material.type] || materialTypeConfig.OTHER;
                    const TypeIcon = typeConfig.icon;
                    
                    return (
                      <tr key={material.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${typeConfig.bgColor}`}>
                              <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                            </div>
                            <div>
                              <p className="font-black text-slate-700 group-hover:text-emerald-600 transition-colors">{material.title}</p>
                              <p className="text-xs font-bold text-slate-400">{material.fileName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${typeConfig.bgColor} ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{formatFileSize(material.fileSize)}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{new Date(material.createdAt).toLocaleDateString('ar-EG')}</td>
                        <td className="px-8 py-5 text-left">
                          <div className="flex items-center justify-end gap-2">
                            {material.publicUrl && (
                              <>
                                <a
                                  href={material.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all"
                                  title="عرض"
                                >
                                  <Eye className="w-5 h-5" />
                                </a>
                                <a
                                  href={material.publicUrl}
                                  download={material.fileName}
                                  className="p-2 bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                                  title="تحميل"
                                >
                                  <Download className="w-5 h-5" />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
