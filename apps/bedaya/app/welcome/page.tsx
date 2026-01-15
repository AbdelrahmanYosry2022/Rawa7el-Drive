'use client'

import { Clock, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@rawa7el/supabase/client'
import { useEffect } from 'react'

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center border border-white/20">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
            <Clock className="w-10 h-10 text-emerald-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">أهلاً بك..</h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          تم تسجيل حسابك بنجاح.
          <br />
          <span className="font-semibold text-emerald-600">سيتم تفعيل المنصة قريباً</span>
        </p>

        <div className="flex flex-col gap-3">
            <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 underline text-sm"
            >
                تسجيل الخروج
            </button>
        </div>
      </div>
    </div>
  )
}
