'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@rawa7el/supabase/client'
import Link from 'next/link'
import { User, Mail, Lock, Phone, Loader2, Upload, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
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
  const router = useRouter()
  const supabase = createClient()

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

    // 5. Password (Capital & Small)
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

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            role: 'STUDENT', // Default role
            avatar_url: avatarUrl
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        // Success - Show verification message
        setSuccess(true)
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">تحقق من بريدك الإلكتروني</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            تم إرسال رابط تفعيل الحساب إلى بريدك الإلكتروني.
            <br />
            يرجى النقر على الرابط لتفعيل حسابك والدخول إلى المنصة.
          </p>
          <Link href="/login" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20 relative">
        <Link href="/login" className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowRight className="w-6 h-6" />
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">إنشاء حساب جديد</h1>
          <p className="text-gray-500 text-sm">أدخل بياناتك للتسجيل في المنصة</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">الاسم الثلاثي <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-right"
                placeholder="الاسم الكامل"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">الصورة الشخصية <span className="text-gray-400 font-normal text-xs">(اختياري)</span></label>
            <div className="relative">
              <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all text-right file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">البريد الإلكتروني <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all dir-ltr text-left placeholder:text-right"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">رقم الهاتف <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all dir-ltr text-left placeholder:text-right"
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">كلمة المرور <span className="text-red-500">*</span></label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pr-11 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="********"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'إنشاء الحساب'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
