'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  User,
  LogOut,
  Settings,
  FolderKanban,
  Bookmark,
} from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const mainNav: NavItem[] = [
  {
    title: 'لوحة التحكم',
    href: '/',
    icon: LayoutDashboard,
  },
];

const pinnedNav: NavItem[] = [
  {
    title: 'دوراتي',
    href: '/dashboard/courses',
    icon: BookOpen,
  },
  {
    title: 'اختباراتي',
    href: '/dashboard/exams',
    icon: GraduationCap,
  },
];

const folderNav: NavItem[] = [
  {
    title: 'المستوى التمهيدي',
    href: '/dashboard/levels/intro',
    icon: FolderKanban,
  },
  {
    title: 'مستوى العقيدة',
    href: '/dashboard/levels/aqueedah',
    icon: FolderKanban,
  },
  {
    title: 'مستوى الفقه',
    href: '/dashboard/levels/fiqh',
    icon: FolderKanban,
  },
  {
    title: 'مستوى الحديث',
    href: '/dashboard/levels/hadith',
    icon: FolderKanban,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const renderNavGroup = (label: string, items: NavItem[], smallLabel?: boolean) => (
    <div className="space-y-1">
      <p
        className={cn(
          'px-4 text-[10px] font-semibold tracking-[0.2em] text-slate-400',
          smallLabel && 'mt-4'
        )}
      >
        {label}
      </p>
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="block">
            <span
              className={cn(
                'relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg border-r-4 transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-500 shadow-sm'
                  : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                )}
              />
              <span className="truncate">{item.title}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-l border-slate-100 flex flex-col h-full overflow-y-auto shadow-sm">
      {/* Logo Area */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="text-right">
            <h1 className="font-bold text-base text-slate-900">أكاديمية الأساس</h1>
            <p className="text-[11px] text-slate-400">Rawa7el Drive</p>
          </div>
        </div>
        <div className="px-2 py-1 rounded-full bg-indigo-50 text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
          <Bookmark className="w-3 h-3" />
          للطلاب
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {renderNavGroup('الرئيسية', mainNav)}

        {renderNavGroup('مُثبَّت', pinnedNav, true)}

        {renderNavGroup('المجلدات', folderNav, true)}

        <div className="space-y-1 pt-2">
          <p className="px-4 text-[10px] font-semibold tracking-[0.2em] text-slate-400">الحساب</p>
          <Link href="/dashboard/profile" className="block">
            <span className="relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg border-r-4 border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer">
              <User className="w-5 h-5 text-slate-400" />
              <span className="truncate">الملف الشخصي</span>
            </span>
          </Link>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <Settings className="w-5 h-5 text-slate-400" />
          الإعدادات
        </button>

        <SignOutButton>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
