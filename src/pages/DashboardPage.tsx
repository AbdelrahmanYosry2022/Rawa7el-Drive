import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Calendar,
  BookOpen,
  UserPlus,
  ClipboardCheck,
  TrendingUp,
  ArrowLeft,
  Bell,
  FolderOpen,
  GraduationCap,
  LogOut,
  Loader2
} from 'lucide-react'

const quickActions = [
  { id: 'invitations', title: 'روابط الدعوة', description: 'إنشاء وإدارة روابط تسجيل الطلاب الجدد', icon: UserPlus, href: '/invitations', gradient: 'linear-gradient(to bottom right, #6366f1, #9333ea)' },
  { id: 'lectures', title: 'المحاضرات', description: 'إدارة المحاضرات والمواد التعليمية', icon: GraduationCap, href: '/lectures', gradient: 'linear-gradient(to bottom right, #8b5cf6, #9333ea)' },
  { id: 'calendar', title: 'التقويم', description: 'عرض جدول المحاضرات والمواعيد', icon: Calendar, href: '/calendar', gradient: 'linear-gradient(to bottom right, #0ea5e9, #06b6d4)' },
  { id: 'students', title: 'إدارة الطلاب', description: 'تسجيل وعرض وتعديل بيانات الطلاب', icon: Users, href: '/students', gradient: 'linear-gradient(to bottom right, #10b981, #14b8a6)' },
  { id: 'attendance', title: 'الحضور والغياب', description: 'تسجيل حضور وغياب الطلاب', icon: ClipboardCheck, href: '/attendance', gradient: 'linear-gradient(to bottom right, #6366f1, #9333ea)' },
  { id: 'library', title: 'مكتبة المواد', description: 'تصفح وتنظيم المواد التعليمية', icon: FolderOpen, href: '/library', gradient: 'linear-gradient(to bottom right, #f59e0b, #f97316)' },
  { id: 'reports', title: 'التقارير', description: 'تقارير الحضور والتقدم', icon: TrendingUp, href: '/reports', gradient: 'linear-gradient(to bottom right, #ec4899, #f43f5e)' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [studentCount, setStudentCount] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)

  const [attendanceCount, setAttendanceCount] = useState(0)
  const [attendanceRate, setAttendanceRate] = useState(0)

  useEffect(() => {
    checkUser()
    fetchStats()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        () => fetchStats()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchStats = async () => {
    await fetchStudentCount()
    await fetchAttendanceStats()
  }

  const fetchAttendanceStats = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

      // Get present count for today
      const { count, error } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', 'present')

      if (error) throw error

      const presentCount = count || 0
      setAttendanceCount(presentCount)

      // Calculate rate
      // We need total students count to calculate rate correctly
      // We can use the state 'studentCount' but it might not be ready yet.
      // So let's fetch total students count again or pass it.
      // Better to fetch total students count here or wait for fetchStudentCount.
      // Let's rely on fetchStudentCount updating the state, but state updates are async.
      // So let's chain the calls or fetch total again.

      const { count: totalStudents, error: studentError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      if (studentError) throw studentError

      if (totalStudents && totalStudents > 0) {
        setAttendanceRate(Math.round((presentCount / totalStudents) * 100))
      } else {
        setAttendanceRate(0)
      }

    } catch (error) {
      console.error('Error fetching attendance stats:', error)
    }
  }

  const triggerPulse = () => {
    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 1000)
  }

  const fetchStudentCount = async () => {
    try {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      if (error) throw error
      if (count !== null) setStudentCount(count)
    } catch (error) {
      console.error('Error fetching student count:', error)
    }
  }

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        navigate('/login')
        return
      }

      const { data: userData } = await supabase
        .from('User')
        .select('role')
        .eq('id', authUser.id)
        .single()

      if (userData?.role === 'STUDENT') {
        navigate('/student')
        return
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #f8fafc, white, #ecfdf5)' }}>
      <header style={{ borderBottom: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.8)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(to bottom right, #10b981, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>منصة بداية</h1>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>للتأهيل العلمي والتربوي</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}>
                <Bell style={{ width: '1.25rem', height: '1.25rem', color: '#475569' }} />
                <span style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', width: '0.5rem', height: '0.5rem', background: '#ef4444', borderRadius: '50%' }} />
              </button>
              <button
                onClick={handleLogout}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', transition: 'all 0.2s' }}
                title="تسجيل الخروج"
              >
                <LogOut style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ background: 'linear-gradient(to bottom right, #10b981, #14b8a6)', borderRadius: '1.5rem', padding: '2rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '16rem', height: '16rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', marginRight: '-8rem', marginTop: '-8rem' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '12rem', height: '12rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', marginLeft: '-6rem', marginBottom: '-6rem' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>مرحباً 👋</h2>
            <p style={{ color: '#d1fae5', fontSize: '1.125rem' }}>أهلاً بك في منصة بداية للتأهيل العلمي والتربوي</p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'إجمالي الطلاب', value: studentCount, icon: Users, isLive: true },
            { label: 'الحضور اليوم', value: attendanceCount, icon: ClipboardCheck },
            { label: 'المجموعات النشطة', value: '0', icon: BookOpen },
            { label: 'نسبة الحضور', value: `${attendanceRate}%`, icon: TrendingUp },
          ].map((stat, idx) => {
            const Icon = stat.icon
            const isTarget = stat.isLive
            return (
              <div key={idx} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '1rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: '1.25rem', height: '1.25rem', color: '#059669' }} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#0f172a',
                      transition: 'all 0.3s ease',
                      transform: isTarget && isPulsing ? 'scale(1.2)' : 'scale(1)',
                      color: isTarget && isPulsing ? '#10b981' : '#0f172a'
                    }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{stat.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1.5rem 3rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>الإجراءات السريعة</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.id} to={action.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', border: '2px solid #f1f5f9', borderRadius: '1rem', overflow: 'hidden', transition: 'all 0.3s', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ background: action.gradient, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: '1.75rem', height: '1.75rem', color: 'white' }} />
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>{action.title}</h4>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>{action.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#059669' }}>
                        <span>الدخول</span>
                        <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <div style={{ position: 'fixed', bottom: '1.5rem', left: '1.5rem', zIndex: 50 }}>
        <Link to="/students/new" style={{ textDecoration: 'none' }}>
          <button style={{ background: 'linear-gradient(to right, #10b981, #14b8a6)', color: 'white', borderRadius: '9999px', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
            <UserPlus style={{ width: '1.25rem', height: '1.25rem' }} />
            إضافة طالب جديد
          </button>
        </Link>
      </div>
    </div>
  )
}
