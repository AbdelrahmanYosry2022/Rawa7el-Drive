'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Header() {
  const { user } = useUser();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
      
      {/* Left Side: User Profile */}
      <div className="flex items-center gap-4">
         <div className="hidden md:block text-left rtl:text-right">
          <p className="text-sm font-semibold text-slate-900 leading-none">
            {user?.fullName || 'طالب'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
        <UserButton 
            appearance={{
                elements: {
                    avatarBox: "w-10 h-10"
                }
            }}
        />
      </div>

      {/* Right Side: Search & Notifications */}
      <div className="flex items-center gap-4 flex-1 max-w-md justify-end">
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="ابحث عن دورة..." 
            className="pr-10 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:ring-offset-0" 
          />
        </div>
        <button className="relative p-2.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 left-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
}
