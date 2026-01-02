import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Video, 
  Music, 
  Image as ImageIcon, 
  FileSpreadsheet,
  Link as LinkIcon,
  File,
  Download,
  FolderOpen,
  ArrowRight
} from 'lucide-react';

export const revalidate = 60;

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

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ResourcesPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch all resources grouped by subject
  const subjects = await prisma.subject.findMany({
    include: {
      resources: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { resources: true },
      },
    },
    orderBy: { title: 'asc' },
  });

  const totalResources = subjects.reduce((sum, s) => sum + s._count.resources, 0);

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-slate-400 hover:text-slate-600">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">منصة المناهج والملفات</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalResources} ملف متاح للتحميل
          </p>
        </div>
      </div>

      {/* Resources by Subject */}
      {subjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <FolderOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">لا توجد مواد دراسية حالياً</p>
          <p className="text-slate-400 text-sm mt-1">سيتم إضافة الملفات قريباً</p>
        </div>
      ) : (
        <div className="space-y-8">
          {subjects.map((subject) => (
            <section key={subject.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: subject.color ? `${subject.color}20` : '#E0E7FF',
                      color: subject.color || '#6366F1'
                    }}
                  >
                    {subject.icon ? (
                      <span className="text-lg">{subject.icon}</span>
                    ) : (
                      <FolderOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{subject.title}</h2>
                    <p className="text-xs text-slate-400">{subject._count.resources} ملف</p>
                  </div>
                </div>
                <Link 
                  href={`/subjects/${subject.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  عرض المادة
                </Link>
              </div>

              {subject.resources.length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-6 text-center">
                  <p className="text-slate-400 text-sm">لا توجد ملفات في هذه المادة</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subject.resources.map((resource) => {
                    const Icon = resourceTypeIcons[resource.type];
                    const colors = resourceTypeColors[resource.type];
                    const label = resourceTypeLabels[resource.type];
                    
                    return (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Card className="bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-slate-200 transition-all cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-slate-900 line-clamp-2">
                                  {resource.title}
                                </h3>
                                {resource.description && (
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                    {resource.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                                    {label}
                                  </span>
                                  {resource.fileSize && (
                                    <span className="text-[10px] text-slate-400">
                                      {formatFileSize(resource.fileSize)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
