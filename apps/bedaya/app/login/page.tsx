'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@rawa7el/supabase/client'
import { Button } from '@rawa7el/ui/button'
import { Input } from '@rawa7el/ui/input'
import { Card, CardContent } from '@rawa7el/ui/card'
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Bypass for dummy mode (Development only)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
      document.cookie = "dummy-auth=true; path=/; max-age=3600";
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      router.push('/')
      router.refresh()
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
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
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">منصة بداية</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              required
              autoComplete="email"
              disabled={isLoading}
              className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right"
            />
          </div>

          <div className="relative group">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              required
              autoComplete="current-password"
              disabled={isLoading}
              className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-right pr-4 pl-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium animate-in fade-in duration-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-200 shadow-sm"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'تسجيل الدخول'}
          </Button>

          <div className="text-center pt-2">
            <Link href="/register" className="text-sm text-emerald-600 font-semibold hover:underline">
              إنشاء حساب جديد
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
