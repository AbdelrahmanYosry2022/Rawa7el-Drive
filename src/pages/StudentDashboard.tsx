import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BookOpen, Sparkles, ArrowLeft, LogOut, Loader2 } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        navigate('/login')
        return
      }

      const { data: userData } = await supabase
        .from('User')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans" dir="rtl">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl mix-blend-multiply filter animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl mix-blend-multiply filter animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      {/* Logout Button */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full text-gray-600 hover:text-red-600 hover:bg-white transition-all shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">تسجيل الخروج</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white shadow-sm border border-gray-100 mb-4">
             <Sparkles className="w-4 h-4 text-amber-400 ml-2" />
             <span className="text-xs font-bold text-gray-600 tracking-wide uppercase">رؤية تعليمية طموحة</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tight leading-tight">
             مرحباً <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">{user?.name?.split(' ')[0] || 'طالب'}</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            محطة الانطلاق نحو إتقان المهارات التعليمية والتربوية، والارتقاء بالأداء المهني بأساليب حديثة ومبتكرة.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          {/* Bedaya Platform Card */}
          <div 
            onClick={() => navigate('/dashboard')} 
            className="group cursor-pointer bg-white rounded-3xl p-2 shadow-soft hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 transform hover:-translate-y-1 ring-1 ring-gray-100"
          >
            <div className="h-full flex flex-col p-8 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white group-hover:from-emerald-50 transition-colors">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">بداية الإنطلاق</h2>
              <p className="text-slate-600 leading-relaxed mb-8 flex-1 text-sm md:text-base">
                <span className="block font-bold mb-2 text-emerald-700">الرسالة:</span>
                تطبيق طرق التعلم الحديثة للإرتقاء بالمعلمين (معرفيا ومهاريا و وجدانيا) لتطوير منظومة العطاء وإدارة الحلقات العلمية والتربوية بشكل متميز.
              </p>
              <div className="flex items-center text-emerald-600 font-bold group-hover:translate-x-[-8px] transition-transform">
                الدخول للبرنامج <ArrowLeft className="mr-2 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
        
        <footer className="mt-20 text-center">
            <p className="text-slate-400 text-sm font-medium">© {new Date().getFullYear()} رواحل التعليمية. جميع الحقوق محفوظة.</p>
        </footer>
      </div>
    </div>
  );
}
