import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Folder, BookOpen, GraduationCap, FileText } from 'lucide-react';

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Ensure User Exists in DB (sync with Clerk)
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!dbUser) {
    const email = user.emailAddresses[0]?.emailAddress;
    if (email) {
      dbUser = await prisma.user.create({
        data: {
          clerkId: user.id,
          email,
          role: 'STUDENT',
        },
      });
    }
  }

  const createdDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });

  const categories = [
    { name: 'المستوى التمهيدي', files: 3 },
    { name: 'مستوى العقيدة', files: 5 },
    { name: 'مستوى الفقه', files: 2 },
    { name: 'مستوى الحديث', files: 4 },
  ];

  const items = [
    {
      title: 'مدخل إلى أصول الفقه',
      description: 'دورة تأسيسية لطلاب المستوى الأول',
      type: 'course' as const,
      badge: 'فيديو',
      date: 'منذ ساعتين',
    },
    {
      title: 'اختبار الوحدة الأولى في العقيدة',
      description: '10 أسئلة اختيار من متعدد',
      type: 'exam' as const,
      badge: 'اختبار',
      date: 'غداً 8 مساءً',
    },
    {
      title: 'ملف ملخص أحكام الطهارة',
      description: 'مذكرة PDF مختصرة',
      type: 'file' as const,
      badge: 'PDF',
      date: '12 نوفمبر 2025',
    },
    {
      title: 'شرح الأربعين النووية',
      description: 'سلسلة دروس صوتية',
      type: 'course' as const,
      badge: 'صوتي',
      date: 'منذ أسبوع',
    },
  ];

  const getBadgeStyles = (badge: string) => {
    switch (badge) {
      case 'PDF':
        return 'bg-rose-100 text-rose-600';
      case 'فيديو':
        return 'bg-indigo-100 text-indigo-600';
      case 'اختبار':
        return 'bg-emerald-100 text-emerald-600';
      case 'صوتي':
        return 'bg-sky-100 text-sky-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getItemIcon = (type: 'course' | 'exam' | 'file') => {
    switch (type) {
      case 'course':
        return BookOpen;
      case 'exam':
        return GraduationCap;
      case 'file':
      default:
        return FileText;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      {/* Header: title, meta, avatars & actions */}
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-right">
          <h1 className="text-3xl font-bold text-slate-900">أكاديمية الأساس</h1>
          <p className="text-xs text-slate-400">
            تم الإنشاء: {createdDate} · 0 دورة · 0 اختبار
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Avatar group */}
          <div className="flex -space-x-3 rtl:space-x-reverse">
            <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white text-xs font-semibold text-white flex items-center justify-center shadow-sm">
              {user.firstName?.[0] || 'ط'}
            </div>
            <div className="w-8 h-8 rounded-full bg-sky-400 border-2 border-white text-xs font-semibold text-white flex items-center justify-center shadow-sm">
              أ
            </div>
            <div className="w-8 h-8 rounded-full bg-violet-400 border-2 border-white text-xs font-semibold text-white flex items-center justify-center shadow-sm">
              م
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white text-[10px] font-semibold text-slate-600 flex items-center justify-center shadow-sm">
              +3
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 h-9 text-sm"
            >
              مشاركة
            </Button>
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2 h-9 text-sm shadow-sm">
              تعديل
            </Button>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <section>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-3 flex items-center gap-3 max-w-xl">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ابحث عن دورة أو ملف..."
            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-slate-400 text-slate-700"
          />
        </div>
      </section>

      {/* Folder-like category cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">المستويات</h2>
          <span className="text-xs text-slate-400">{categories.length} مجلدات</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((category) => (
            <Card
              key={category.name}
              className="bg-white border border-slate-100 shadow-sm rounded-xl flex flex-col items-center justify-center py-6"
            >
              <CardContent className="flex flex-col items-center justify-center gap-3 p-0">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Folder className="w-8 h-8" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-slate-900">{category.name}</p>
                  <p className="text-[11px] text-slate-400">{category.files} مواد</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Files / Courses grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">الدورات والاختبارات</h2>
          <span className="text-xs text-slate-400">{items.length} عناصر</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => {
            const Icon = getItemIcon(item.type);
            return (
              <Card
                key={item.title}
                className="bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold ${getBadgeStyles(
                        item.badge
                      )}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <div className="space-y-1 text-right">
                    <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-400 text-left rtl:text-right">
                    {item.date}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
