import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        } else if (error.message.includes('Email not confirmed')) {
          setError('يرجى تأكيد بريدك الإلكتروني أولاً')
        } else {
          setError('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى')
        }
        setIsLoading(false)
        return
      }

      // Get user role from User table
      const { data: userData } = await supabase
        .from('User')
        .select('role')
        .eq('id', authData.user?.id)
        .single()

      setLoginSuccess(true)
      
      // Redirect based on role
      const userRole = userData?.role || 'STUDENT'
      setTimeout(() => {
        if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'TEACHER') {
          navigate('/dashboard')
        } else {
          navigate('/student') // Student dashboard
        }
      }, 1500)
    } catch {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى')
      setIsLoading(false)
    }
  }

  if (loginSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5, #a7f3d0)', padding: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '2.5rem', maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '6rem', height: '6rem', background: '#ecfdf5', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
            <CheckCircle2 style={{ width: '3rem', height: '3rem', color: '#059669' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>تم تسجيل الدخول بنجاح!</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem', fontWeight: '500' }}>مرحباً بك في منصة بداية</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 style={{ width: '2rem', height: '2rem', color: '#059669' }} className="animate-spin" />
            <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>جاري تحميل المنصة...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', borderRadius: '1rem', background: '#ecfdf5', marginBottom: '1rem' }}>
            <ShieldCheck style={{ width: '2rem', height: '2rem', color: '#059669' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>منصة بداية</h1>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              required
              autoComplete="email"
              disabled={isLoading}
              style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 1rem', textAlign: 'right', outline: 'none' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              required
              autoComplete="current-password"
              disabled={isLoading}
              style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 3rem 0 1rem', textAlign: 'right', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
            </button>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center', fontWeight: '500' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            style={{ width: '100%', height: '3rem', background: '#059669', color: 'white', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1 }}
          >
            {isLoading ? <Loader2 style={{ width: '1.25rem', height: '1.25rem', margin: '0 auto' }} className="animate-spin" /> : 'تسجيل الدخول'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.625rem', color: '#9ca3af', marginTop: '3rem' }}>
          © {new Date().getFullYear()} RAWA7EL PLATFORM
        </p>
      </div>
    </div>
  )
}
