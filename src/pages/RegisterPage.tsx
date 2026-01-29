import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2, AlertCircle, User, Mail, Phone, Lock } from 'lucide-react'

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [inviteValid, setInviteValid] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  useEffect(() => {
    if (inviteToken) {
      validateInvite()
    } else {
      setIsValidating(false)
      setError('رابط الدعوة غير صالح')
    }
  }, [inviteToken])

  const validateInvite = async () => {
    try {
      const { data, error } = await supabase
        .from('invitation_links')
        .select('*')
        .eq('token', inviteToken)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setError('رابط الدعوة غير صالح أو منتهي الصلاحية')
        setInviteValid(false)
      } else {
        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError('رابط الدعوة منتهي الصلاحية')
          setInviteValid(false)
        } else if (data.max_uses && data.uses_count >= data.max_uses) {
          setError('رابط الدعوة وصل للحد الأقصى من الاستخدامات')
          setInviteValid(false)
        } else {
          setInviteValid(true)
        }
      }
    } catch (err) {
      setError('حدث خطأ في التحقق من رابط الدعوة')
      setInviteValid(false)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setIsLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone
          }
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('البريد الإلكتروني مسجل بالفعل')
        } else {
          setError('حدث خطأ أثناء التسجيل')
        }
        return
      }

      if (authData.user) {
        // Create user profile
        await supabase.from('User').insert({
          id: authData.user.id,
          email: formData.email.trim().toLowerCase(),
          name: formData.name,
          phone: formData.phone,
          role: 'STUDENT',
          platform: 'BEDAYA',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

        // Update invitation uses count
        if (inviteToken) {
          await supabase.rpc('increment_invite_uses', { invite_token: inviteToken })
        }

        setRegisterSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isValidating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5, #a7f3d0)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '3rem', height: '3rem', color: '#059669', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#059669' }}>جاري التحقق من رابط الدعوة...</p>
        </div>
      </div>
    )
  }

  // Invalid invite
  if (!inviteValid && !isValidating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #fef2f2, #fee2e2, #fecaca)', padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', maxWidth: '24rem', width: '100%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '4rem', height: '4rem', background: '#fef2f2', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertCircle style={{ width: '2rem', height: '2rem', color: '#dc2626' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>رابط غير صالح</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={() => navigate('/login')}
            style={{ padding: '0.75rem 1.5rem', background: '#059669', color: 'white', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: '600' }}
          >
            الذهاب لتسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (registerSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5, #a7f3d0)', padding: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '2rem', padding: '2.5rem', maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '5rem', height: '5rem', background: '#ecfdf5', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 style={{ width: '2.5rem', height: '2.5rem', color: '#059669' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>تم التسجيل بنجاح!</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>مرحباً بك في منصة بداية</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Loader2 style={{ width: '1.25rem', height: '1.25rem', color: '#059669' }} />
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>جاري التحويل لصفحة تسجيل الدخول...</span>
          </div>
        </div>
      </div>
    )
  }

  // Registration form
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', borderRadius: '1rem', background: '#ecfdf5', marginBottom: '1rem' }}>
            <ShieldCheck style={{ width: '2rem', height: '2rem', color: '#059669' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>تسجيل حساب جديد</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>منصة بداية للحلقات القرآنية</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="الاسم الكامل"
              required
              style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 2.5rem 0 1rem', textAlign: 'right', outline: 'none' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="البريد الإلكتروني"
              required
              dir="ltr"
              style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 2.5rem 0 1rem', textAlign: 'right', outline: 'none' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Phone style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="رقم الهاتف (اختياري)"
              dir="ltr"
              style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 2.5rem 0 1rem', textAlign: 'right', outline: 'none' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="كلمة المرور"
              required
              dir="ltr"
              style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 2.5rem 0 2.5rem', textAlign: 'right', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '1.25rem', height: '1.25rem', color: '#9ca3af' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="تأكيد كلمة المرور"
              required
              dir="ltr"
              style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 2.5rem 0 1rem', textAlign: 'right', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ width: '100%', height: '3rem', background: '#059669', color: 'white', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, marginTop: '0.5rem' }}
          >
            {isLoading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
            لديك حساب بالفعل؟{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ color: '#059669', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              تسجيل الدخول
            </button>
          </p>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.625rem', color: '#9ca3af', marginTop: '1.5rem' }}>
          © {new Date().getFullYear()} RAWA7EL PLATFORM
        </p>
      </div>
    </div>
  )
}
