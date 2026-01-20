'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@rawa7el/supabase/client'
import Link from 'next/link'
import { Button } from '@rawa7el/ui/button'
import { Input } from '@rawa7el/ui/input'
import { Card, CardContent } from '@rawa7el/ui/card'
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Loader2, 
  Upload, 
  ArrowRight, 
  ShieldX, 
  Link2, 
  CheckCircle2, 
  Circle,
  ShieldCheck,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react'

function RegisterForm() {
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidatingInvite, setIsValidatingInvite] = useState(true)
  const [inviteValid, setInviteValid] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    upperLower: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setPasswordRequirements({
      length: formData.password.length >= 8,
      upperLower: /(?=.*[a-z])(?=.*[A-Z])/.test(formData.password),
    })
  }, [formData.password])

  // Validate invitation token on mount
  useEffect(() => {
    const validateInvite = async () => {
      if (!inviteToken) {
        setIsValidatingInvite(false)
        setInviteError('يجب الحصول على رابط دعوة للتسجيل في المنصة')
        return
      }

      try {
        const response = await fetch(`/api/invitations/validate?token=${inviteToken}`)
        const data = await response.json()

        if (data.valid) {
          setInviteValid(true)
        } else {
          setInviteError(data.error || 'رابط الدعوة غير صالح')
        }
      } catch (err) {
        setInviteError('حدث خطأ في التحقق من رابط الدعوة')
      } finally {
        setIsValidatingInvite(false)
      }
    }

    validateInvite()
  }, [inviteToken])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0])
    }
  }

  const validateForm = () => {
    // 1. Required Fields (Already handled by HTML 'required' for simple inputs, but we check logically)
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError('جميع البيانات مطلوبة ما عدا الصورة الشخصية')
      return false
    }

    // 2. Full Name (Triple)
    const nameParts = formData.name.trim().split(/\s+/)
    if (nameParts.length < 3) {
      setError('يجب كتابة الاسم الثلاثي على الأقل')
      return false
    }

    // 3. Valid Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('البريد الإلكتروني غير صحيح')
      return false
    }

    // 4. Egyptian Phone Number
    const phoneRegex = /^01[0125][0-9]{8}$/
    if (!phoneRegex.test(formData.phone)) {
      setError('رقم الهاتف يجب أن يكون رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)')
      return false
    }

    // 5. Password (Minimum 8 characters & Capital & Small)
    if (formData.password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return false
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
      setError('كلمة المرور يجب أن تحتوي على حروف كبيرة (Capital) وصغيرة (Small)')
      return false
    }

    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    // Bypass for dummy mode (Development only)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      document.cookie = "dummy-auth=true; path=/; max-age=3600";
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      router.push('/welcome') // Redirect to welcome page for new users
      return
    }

    try {
      let avatarUrl = ''

      // Upload Avatar if exists
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
          avatarUrl = publicUrl
        }
      }

      // Check if email already exists via API
      const checkEmailResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
      })
      const { exists: emailExists } = await checkEmailResponse.json()

      if (emailExists) {
        setError('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.')
        setIsLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Disable email redirect
          data: {
            name: formData.name,
            phone: formData.phone,
            role: 'STUDENT', // Default role
            avatar_url: avatarUrl
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (data.user) {
        // Auto-confirm the user (skip email verification)
        await fetch('/api/auth/confirm-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id })
        })

        // Increment invitation usage count
        if (inviteToken) {
          await fetch('/api/invitations/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken })
          })
        }
        // Success - Redirect to login page directly
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?registered=true')
        }, 2000)
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while validating invite
  if (isValidatingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-12 max-w-md w-full border border-white/20 text-center space-y-4">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-emerald-100 rounded-3xl animate-pulse" />
            <Loader2 className="relative w-20 h-20 animate-spin text-emerald-500 p-4" />
          </div>
          <p className="text-gray-600 font-medium">جاري التحقق من رابط الدعوة...</p>
        </div>
      </div>
    )
  }

  // Show error if invite is invalid
  if (!inviteValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 text-right" dir="rtl">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full border border-white/20 text-center">
          <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
            <ShieldX className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">رابط غير صالح</h2>
          <p className="text-gray-600 mb-10 leading-relaxed font-medium">
            {inviteError}
          </p>
          <div className="space-y-6">
            <p className="text-sm text-gray-500 bg-gray-50 py-3 px-4 rounded-2xl">
              للتسجيل في المنصة، يرجى التواصل مع المشرف للحصول على رابط دعوة صالح.
            </p>
            <Button asChild className="w-full h-13 bg-gray-900 hover:bg-black text-white rounded-2xl transition-all">
              <Link href="/login" className="flex items-center justify-center gap-2">
                <span>العودة لتسجيل الدخول</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 text-right" dir="rtl">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full border border-white/20 text-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">تم إنشاء الحساب بنجاح!</h2>
          <p className="text-gray-600 mb-10 leading-relaxed font-medium">
            مرحباً بك في منصة بداية
            <br />
            جاري تحويلك لصفحة تسجيل الدخول...
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans" dir="rtl">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-4">
            <Link2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <Input
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="الاسم الثلاثي"
            className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
          />
          
          <Input
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="رقم الهاتف"
            className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-left dir-ltr placeholder:text-right"
          />

          <Input
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="البريد الإلكتروني"
            className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-left dir-ltr placeholder:text-right"
          />

          <div className="relative group">
            <input
              name="avatar"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="avatar-upload"
            />
            <label 
              htmlFor="avatar-upload"
              className="flex items-center justify-between w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all"
            >
              <span className="text-gray-400 text-sm truncate">
                {avatarFile ? avatarFile.name : 'الصورة الشخصية (اختياري)'}
              </span>
              <span className="text-xs text-emerald-600 font-bold">تصفح</span>
            </label>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="كلمة المرور"
                className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex gap-4 text-[10px] text-gray-400 px-1">
              <div className="flex items-center gap-1">
                {passwordRequirements.length ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Circle className="w-3 h-3" />}
                <span>8 أحرف</span>
              </div>
              <div className="flex items-center gap-1">
                {passwordRequirements.upperLower ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Circle className="w-3 h-3" />}
                <span>حروف كبيرة وصغيرة</span>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center font-medium">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading || !passwordRequirements.length || !passwordRequirements.upperLower}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إنشاء الحساب'}
          </Button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-emerald-600 font-semibold hover:underline">
              لديك حساب؟ تسجيل الدخول
            </Link>
          </div>
        </form>

        <p className="text-center text-[10px] text-gray-400 mt-12">
          © {new Date().getFullYear()} RAWA7EL PLATFORM
        </p>
      </div>
    </div>
  )
}

function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    </div>
  )
}

// Main export with Suspense wrapper
export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  )
}
