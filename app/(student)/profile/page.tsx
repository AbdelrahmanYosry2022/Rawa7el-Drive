import { UserProfile } from '@clerk/nextjs';

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">الملف الشخصي</h1>
        <p className="text-sm text-slate-500 mt-1">إدارة معلومات حسابك وإعدادات الأمان</p>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <UserProfile 
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border-0',
              navbar: 'hidden',
              pageScrollBox: 'p-0',
            },
          }}
        />
      </div>
    </div>
  );
}
