// 'use client' removed for Vite

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
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
  Clock,
  X
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Production URL
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin

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
      const { data, error: fetchError } = await supabase
        .from('invitation_links')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (fetchError) throw fetchError

      // Fetch actual registered user counts per invitation token from User table
      if (data && data.length > 0) {
        const tokens = data.map((inv: InvitationLink) => inv.token)
        const { data: users, error: usersError } = await supabase
          .from('User')
          .select('invited_by')
          .in('invited_by', tokens)

        if (!usersError && users) {
          const countMap: Record<string, number> = {}
          users.forEach((u: any) => {
            if (u.invited_by) {
              countMap[u.invited_by] = (countMap[u.invited_by] || 0) + 1
            }
          })
          // Update uses_count with actual count from User table
          const updatedData = data.map((inv: InvitationLink) => ({
            ...inv,
            uses_count: countMap[inv.token] || 0
          }))
          setInvitations(updatedData)
        } else {
          setInvitations(data || [])
        }
      } else {
        setInvitations(data || [])
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching invitations:', err)
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولاً')
      }

      // Generate a random token (max 20 chars to match DB constraint)
      const token = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12)
      
      const { error: insertError } = await supabase
        .from('invitation_links')
        .insert({
          token,
          label: formData.label || null,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          expires_at: formData.expires_at || null,
          is_active: true,
          uses_count: 0,
          created_by: user.id
        })

      if (insertError) throw insertError

      setSuccess('تم إنشاء رابط الدعوة بنجاح')
      setShowForm(false)
      setFormData({ label: '', max_uses: '', expires_at: '' })
      fetchInvitations()
    } catch (err: any) {
      console.error('Error creating invitation:', err)
      // Show detailed error message
      let errorMessage = 'فشل في إنشاء رابط الدعوة'
      if (err?.message) {
        errorMessage += `: ${err.message}`
      }
      if (err?.code) {
        errorMessage += ` (${err.code})`
      }
      if (err?.details) {
        errorMessage += ` - ${err.details}`
      }
      if (err?.hint) {
        errorMessage += ` | تلميح: ${err.hint}`
      }
      setError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const deactivateInvitation = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء تفعيل هذا الرابط؟')) return

    try {
      const { error: updateError } = await supabase
        .from('invitation_links')
        .update({ is_active: false })
        .eq('id', id)

      if (updateError) throw updateError

      setSuccess('تم إلغاء تفعيل الرابط')
      fetchInvitations()
    } catch (err) {
      console.error('Error deactivating invitation:', err)
      setError('فشل في إلغاء تفعيل الرابط')
    }
  }

  const deleteInvitation = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) return

    try {
      const { error: deleteError } = await supabase
        .from('invitation_links')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setSuccess('تم حذف الرابط نهائياً')
      fetchInvitations()
    } catch (err: any) {
      console.error('Error deleting invitation:', err)
      let errorMessage = 'فشل في حذف الرابط'
      if (err?.message) errorMessage += `: ${err.message}`
      setError(errorMessage)
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
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
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
                    placeholder="مثال: رابط المجموعة الأولى"
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
                        <Link 
                          to={`/invitations/${invitation.id}`}
                          className="font-semibold text-slate-900 truncate hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {invitation.label || 'رابط دعوة'}
                        </Link>
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
                      {invitation.is_active ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deactivateInvitation(invitation.id)}
                          className="rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                          title="إلغاء التفعيل"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvitation(invitation.id)}
                          className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="حذف نهائي"
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
