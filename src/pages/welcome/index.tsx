// 'use client' removed for Vite

import { Clock, LogOut, BookOpen, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function WelcomePage() {
  const navigate = useNavigate()
  // supabase is imported from @/lib/supabase
const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('User')
          .select('name')
          .eq('id', user.id)
          .single()
        if ((profile as any)?.name) {
          setUserName((profile as any).name.split(' ')[0])
        }
      }
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center border border-white/20">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
        </div>
        
        {/* Welcome Message */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          أهلاً بك{userName ? ` يا ${userName}` : ''} 👋
        </h1>
        <p className="text-lg text-gray-500 mb-6">في منصة بداية للحلقات القرآنية</p>

        {/* Status Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border border-emerald-100">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="text-emerald-700 font-semibold">تم تسجيل حسابك بنجاح</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>المنصة قيد التجهيز وستُفعَّل قريباً</span>
          </div>
        </div>

        {/* Info */}
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          سيتم إشعارك عبر البريد الإلكتروني عند تفعيل المنصة.
          <br />
          نشكرك على صبرك وانتظارك.
        </p>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 mx-auto px-6 py-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  )
}
