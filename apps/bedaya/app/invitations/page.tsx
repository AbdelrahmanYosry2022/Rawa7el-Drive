'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@rawa7el/supabase/client'
import Link from 'next/link'
import { 
  Link2, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Calendar,
  Users,
  Loader2,
  ArrowRight,
  ExternalLink,
  Clock,
  Hash
} from 'lucide-react'
import { Card, CardContent } from '@rawa7el/ui/card'
import { Button } from '@rawa7el/ui/button'
import { Input } from '@rawa7el/ui/input'

// Production URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rawa7el-drive.vercel.app'

interface InvitationLink {
  id: string
  token: string
  label: string | null
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
  created_by: string
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<InvitationLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    label: '',
    max_uses: '',
    expires_at: ''
  })

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/invitations')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setInvitations(data)
    } catch (err) {
      setError('فشل في تحميل روابط الدعوة')
    } finally {
      setIsLoading(false)
    }
  }

  const createInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: formData.label || null,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          expires_at: formData.expires_at || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create')
      }

      setSuccess('تم إنشاء رابط الدعوة بنجاح')
      setShowForm(false)
      setFormData({ label: '', max_uses: '', expires_at: '' })
      fetchInvitations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء رابط الدعوة')
    } finally {
      setIsCreating(false)
    }
  }

  const deactivateInvitation = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء تفعيل هذا الرابط؟')) return

    try {
      const response = await fetch(`/api/invitations?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to deactivate')

      setSuccess('تم إلغاء تفعيل الرابط')
      fetchInvitations()
    } catch (err) {
      setError('فشل في إلغاء تفعيل الرابط')
    }
  }

  const copyLink = async (token: string, id: string) => {
    const link = `${SITE_URL}/register?invite=${token}`
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusBadge = (invitation: InvitationLink) => {
    if (!invitation.is_active) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">غير مفعل</span>
    }
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">منتهي</span>
    }
    if (invitation.max_uses && invitation.uses_count >= invitation.max_uses) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-full text-xs">مكتمل</span>
    }
    return <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs">نشط</span>
  }

  // Auto-hide messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">روابط الدعوة</h1>
                <p className="text-xs text-slate-500">إنشاء وإدارة روابط تسجيل الطلاب</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Messages */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Create Button / Form */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 ml-2" />
            إنشاء رابط دعوة جديد
          </Button>
        ) : (
          <Card className="mb-6 bg-white border border-slate-200 rounded-2xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">إنشاء رابط دعوة جديد</h3>
              <form onSubmit={createInvitation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    اسم/وصف الرابط (اختياري)
                  </label>
                  <Input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="مثال: رابط حلقة الفجر"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      الحد الأقصى للاستخدام (اختياري)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                      placeholder="غير محدود"
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      تاريخ الانتهاء (اختياري)
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 ml-2" />
                        إنشاء الرابط
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Invitations List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : invitations.length === 0 ? (
          <Card className="bg-white border border-slate-100 rounded-2xl">
            <CardContent className="p-12 text-center">
              <Link2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">لا توجد روابط دعوة</h3>
              <p className="text-slate-500">أنشئ رابط دعوة لتتمكن من إرساله للطلاب للتسجيل</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="bg-white border border-slate-100 rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900 truncate">
                          {invitation.label || 'رابط دعوة'}
                        </h4>
                        {getStatusBadge(invitation)}
                      </div>

                      <div className="flex items-center gap-1 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-3">
                        <code className="text-indigo-600 truncate flex-1" dir="ltr">
                          {`${SITE_URL}/register?invite=${invitation.token}`}
                        </code>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {invitation.uses_count} استخدام
                          {invitation.max_uses && ` / ${invitation.max_uses}`}
                        </span>
                        {invitation.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            ينتهي: {new Date(invitation.expires_at).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          أُنشئ: {new Date(invitation.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(invitation.token, invitation.id)}
                        className="rounded-lg"
                      >
                        {copiedId === invitation.id ? (
                          <>
                            <Check className="w-4 h-4 ml-1 text-emerald-500" />
                            تم النسخ
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 ml-1" />
                            نسخ
                          </>
                        )}
                      </Button>
                      {invitation.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deactivateInvitation(invitation.id)}
                          className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
