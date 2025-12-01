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
} from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';
import Image from 'next/image';

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const studentMainNav: NavItem[] = [
  {
    title: 'لوحة التحكم',
    href: '/',
    icon: LayoutDashboard,
  },
];

const studentPinnedNav: NavItem[] = [
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

const studentFolderNav: NavItem[] = [
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
  const isTeacher = pathname.startsWith('/teacher');

  const teacherMainNav: NavItem[] = [
    {
      title: 'لوحة الإدارة',
      href: '/teacher',
      icon: LayoutDashboard,
    },
  ];

  const teacherManageNav: NavItem[] = [
    {
      title: 'إدارة المواد',
      href: '/teacher/subjects',
      icon: FolderKanban,
    },
    {
      title: 'المستخدمون',
      href: '/teacher/users',
      icon: User,
    },
  ];

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
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-center">
          <Link href="/" aria-label="Rawa7el Drive" className="block">
            <Image
              src="/logo/Rawa7el-drive-logo-v1.svg"
              alt="Rawa7el Drive"
              width={140}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {renderNavGroup('الرئيسية', isTeacher ? teacherMainNav : studentMainNav)}

        {isTeacher ? (
          renderNavGroup('الإدارة', teacherManageNav, true)
        ) : (
          <>
            {renderNavGroup('مُثبَّت', studentPinnedNav, true)}
            {renderNavGroup('المجلدات', studentFolderNav, true)}
          </>
        )}

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
        {isTeacher ? (
          <Link href="/">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              العودة لواجهة الطالب
            </button>
          </Link>
        ) : (
          <Link href="/teacher">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              الذهاب إلى لوحة الإدارة
            </button>
          </Link>
        )}

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
