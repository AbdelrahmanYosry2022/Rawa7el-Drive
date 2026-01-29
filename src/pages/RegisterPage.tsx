import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Check, X } from 'lucide-react'

// Password validation rules
const passwordRules = [
  { id: 'length', label: '8 أحرف على الأقل', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'حرف كبير (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'حرف صغير (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'رقم (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'رمز (!@#$%^&*)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [inviteValid, setInviteValid] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const passwordValid = passwordRules.every(rule => rule.test(password))
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

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
    } catch {
      setError('حدث خطأ في التحقق من رابط الدعوة')
      setInviteValid(false)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!phone.trim()) {
      setError('رقم الهاتف مطلوب')
      return
    }

    if (!passwordValid) {
      setError('كلمة المرور لا تستوفي المعايير المطلوبة')
      return
    }

    if (!passwordsMatch) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    setIsLoading(true)

    try {
      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('User')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (existingEmail) {
        setError('البريد الإلكتروني مسجل بالفعل')
        setIsLoading(false)
        return
      }

      // Check if phone already exists
      const { data: existingPhone } = await supabase
        .from('User')
        .select('id')
        .eq('phone', phone.trim())
        .single()

      if (existingPhone) {
        setError('رقم الهاتف مسجل بالفعل')
        setIsLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: { name, phone: phone.trim() },
          emailRedirectTo: undefined
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('البريد الإلكتروني مسجل بالفعل')
        } else {
          setError(authError.message || 'حدث خطأ أثناء التسجيل')
        }
        setIsLoading(false)
        return
      }

      if (authData.user) {
        const { error: insertError } = await supabase.from('User').upsert({
          id: authData.user.id,
          email: email.trim().toLowerCase(),
          name: name,
          phone: phone.trim() || null,
          role: 'STUDENT',
          platform: 'BEDAYA',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { onConflict: 'id' })

        if (insertError) {
          console.error('Insert error:', insertError)
          setError(`خطأ في حفظ البيانات: ${insertError.message}`)
          setIsLoading(false)
          return
        }

        if (inviteToken) {
          const { data: inviteData } = await supabase
            .from('invitation_links')
            .select('uses_count')
            .eq('token', inviteToken)
            .single()
          
          await supabase
            .from('invitation_links')
            .update({ uses_count: (inviteData?.uses_count || 0) + 1 })
            .eq('token', inviteToken)
        }

        // Registration successful - redirect to login page
        setRegisterSuccess(true)
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch {
      setError('حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading
  if (isValidating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 style={{ width: '2rem', height: '2rem', color: '#059669', margin: '0 auto' }} className="animate-spin" />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>جاري التحقق من رابط الدعوة...</p>
        </div>
      </div>
    )
  }

  // Invalid invite
  if (!inviteValid && !isValidating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ width: '4rem', height: '4rem', background: '#fef2f2', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertCircle style={{ width: '2rem', height: '2rem', color: '#dc2626' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>رابط غير صالح</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => navigate('/login')} style={{ width: '100%', height: '3rem', background: '#059669', color: 'white', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            الذهاب لتسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  // Success
  if (registerSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ width: '4rem', height: '4rem', background: '#ecfdf5', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 style={{ width: '2rem', height: '2rem', color: '#059669' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>تم التسجيل بنجاح!</h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>مرحباً بك في منصة بداية</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Loader2 style={{ width: '1rem', height: '1rem', color: '#059669' }} className="animate-spin" />
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>جاري الدخول للمنصة...</span>
          </div>
        </div>
      </div>
    )
  }

  // Registration form
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '4rem', height: '4rem', borderRadius: '1rem', background: '#ecfdf5', marginBottom: '1rem' }}>
            <ShieldCheck style={{ width: '2rem', height: '2rem', color: '#059669' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>إنشاء حساب جديد</h1>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', color: '#dc2626', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم الكامل"
            required
            style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 1rem', textAlign: 'right', outline: 'none' }}
          />

          {/* Email */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            required
            dir="ltr"
            style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 1rem', textAlign: 'right', outline: 'none' }}
          />

          {/* Phone */}
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الهاتف"
            required
            dir="ltr"
            style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 1rem', textAlign: 'right', outline: 'none' }}
          />

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              required
              dir="ltr"
              style={{ width: '100%', height: '3rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '0 3rem 0 1rem', textAlign: 'right', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
            </button>
          </div>

          {/* Password Rules */}
          {password.length > 0 && (
            <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '0.75rem', fontSize: '0.75rem' }}>
              <p style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>متطلبات كلمة المرور:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                {passwordRules.map(rule => {
                  const passed = rule.test(password)
                  return (
                    <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: passed ? '#059669' : '#9ca3af' }}>
                      {passed ? <Check style={{ width: '0.875rem', height: '0.875rem' }} /> : <X style={{ width: '0.875rem', height: '0.875rem' }} />}
                      <span>{rule.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="تأكيد كلمة المرور"
              required
              dir="ltr"
              style={{ width: '100%', height: '3rem', background: '#f9fafb', border: `1px solid ${confirmPassword.length > 0 ? (passwordsMatch ? '#059669' : '#dc2626') : '#e5e7eb'}`, borderRadius: '0.75rem', padding: '0 3rem 0 1rem', textAlign: 'right', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              {showConfirmPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '-0.75rem' }}>كلمات المرور غير متطابقة</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !passwordValid || !passwordsMatch || !name || !email || !phone}
            style={{ width: '100%', height: '3rem', background: '#059669', color: 'white', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: (isLoading || !passwordValid || !passwordsMatch || !name || !email || !phone) ? 0.5 : 1 }}
          >
            {isLoading ? <Loader2 style={{ width: '1.25rem', height: '1.25rem', margin: '0 auto' }} className="animate-spin" /> : 'إنشاء الحساب'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
            لديك حساب؟{' '}
            <button type="button" onClick={() => navigate('/login')} style={{ color: '#059669', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
              تسجيل الدخول
            </button>
          </p>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.625rem', color: '#9ca3af', marginTop: '2rem' }}>
          © {new Date().getFullYear()} RAWA7EL PLATFORM
        </p>
      </div>
    </div>
  )
}
