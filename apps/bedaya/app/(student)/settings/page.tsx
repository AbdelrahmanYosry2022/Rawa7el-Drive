import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Calendar, Shield, Palette } from 'lucide-react';

export default async function SettingsPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: user.id },
    select: {
      role: true,
      createdAt: true,
      email: true,
      name: true,
    },
  });

  const joinedDate = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'غير معروف';

  const roleLabel = dbUser?.role === 'ADMIN' ? 'مدير النظام' : 'طالب';

  return (
    <div className="max-w-4xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900">الإعدادات</h1>
        <p className="text-sm text-slate-500 mt-1">إدارة إعدادات حسابك والتفضيلات</p>
      </div>

      {/* Account Info */}
      <Card className="bg-white border border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            معلومات الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">الاسم</p>
              <p className="text-sm font-medium text-slate-900">
                {dbUser?.name || user.fullName || 'غير محدد'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
              <p className="text-sm font-medium text-slate-900">
                {dbUser?.email || user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role & Membership */}
      <Card className="bg-white border border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            الصلاحيات والعضوية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                نوع الحساب
              </p>
              <p className="text-sm font-medium text-slate-900">{roleLabel}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                تاريخ الانضمام
              </p>
              <p className="text-sm font-medium text-slate-900">{joinedDate}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance (Placeholder) */}
      <Card className="bg-white border border-slate-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-600" />
            المظهر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">الوضع الداكن</p>
              <p className="text-xs text-slate-500 mt-0.5">تبديل بين الوضع الفاتح والداكن</p>
            </div>
            {/* Visual-only toggle */}
            <button
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors cursor-not-allowed opacity-60"
              disabled
              title="قريباً"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform translate-x-1" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">هذه الميزة قيد التطوير وستتوفر قريباً</p>
        </CardContent>
      </Card>
    </div>
  );
}
