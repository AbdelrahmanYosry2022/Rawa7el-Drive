'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  GraduationCap,
  User,
  Menu,
  Settings,
  LayoutDashboard,
  LogOut,
  FileText,
  ClipboardList,
  FolderOpen,
} from 'lucide-react';
import { useState } from 'react';
import { SignOutButton } from '@clerk/nextjs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@rawa7el/ui/sheet';

interface MobileNavProps {
  userRole: 'ADMIN' | 'STUDENT';
}

const navItems = [
  { href: '/', icon: LayoutGrid, label: 'الرئيسية' },
  { href: '/exams-platform', icon: GraduationCap, label: 'الاختبارات' },
  { href: '/profile', icon: User, label: 'حسابي' },
];

export function MobileNav({ userRole }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Don't show on teacher routes
  if (pathname.startsWith('/teacher')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                isActive ? 'text-indigo-600' : 'text-slate-400'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* More Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors',
                open ? 'text-indigo-600' : 'text-slate-400'
              )}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">المزيد</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-2xl pb-8">
            <SheetHeader className="pb-4 border-b border-slate-100">
              <SheetTitle className="text-right text-base">القائمة</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-1">
              {/* Quick Links */}
              <Link
                href="/exams-platform"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <GraduationCap className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">منصة الاختبارات</span>
              </Link>
              
              <Link
                href="/resources-platform"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">منصة الملفات والموارد</span>
              </Link>
              
              <Link
                href="/activities-platform"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ClipboardList className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">منصة الأنشطة والواجبات</span>
              </Link>

              <div className="border-t border-slate-100 my-2" />

              {/* Settings */}
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium">الإعدادات</span>
              </Link>

              {/* Admin Dashboard - Only for ADMIN */}
              {userRole === 'ADMIN' && (
                <Link
                  href="/teacher"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-sm font-medium">لوحة الإدارة</span>
                </Link>
              )}

              {/* Logout */}
              <SignOutButton>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">تسجيل الخروج</span>
                </button>
              </SignOutButton>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
