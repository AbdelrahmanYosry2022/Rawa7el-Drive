import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { 
  Link2, 
  ArrowRight, 
  Users, 
  Loader2,
  Calendar,
  Mail,
  Phone,
  Clock
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface InvitationLink {
  id: string
  token: string
  label: string | null
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

interface RegisteredUser {
  id: string
  name: string | null
  email: string
  phone: string | null
  createdAt: string
}

export default function InvitationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [invitation, setInvitation] = useState<InvitationLink | null>(null)
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchInvitationDetails()
    }
  }, [id])

  const fetchInvitationDetails = async () => {
    setIsLoading(true)
    try {
      // Fetch invitation details
      const { data: inviteData, error: inviteError } = await supabase
        .from('invitation_links')
        .select('*')
        .eq('id', id)
        .single()

      if (inviteError) throw inviteError
      setInvitation(inviteData)

      // Fetch users who registered with this invitation
      const { data: usersData, error: usersError } = await supabase
        .from('User')
        .select('id, name, email, phone, createdAt')
        .eq('invited_by', inviteData.token)
        .order('createdAt', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
        // If invited_by column doesn't exist, just show empty
        setUsers([])
      } else {
        setUsers(usersData || [])
      }
    } catch (err) {
      console.error('Error fetching invitation details:', err)
      setError('فشل في تحميل تفاصيل الرابط')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!invitation) return null
    if (!invitation.is_active) {
      return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">غير مفعل</span>
    }
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">منتهي</span>
    }
    if (invitation.max_uses && invitation.uses_count >= invitation.max_uses) {
      return <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-sm">مكتمل</span>
    }
    return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-sm">نشط</span>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <Card className="bg-white border border-red-200 rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-red-600">{error || 'الرابط غير موجود'}</p>
              <Link to="/invitations" className="text-indigo-600 hover:underline mt-4 inline-block">
                العودة لروابط الدعوة
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/invitations" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{invitation.label || 'رابط دعوة'}</h1>
                <p className="text-xs text-slate-500">تفاصيل الرابط والمسجلين</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Invitation Info Card */}
        <Card className="bg-white border border-slate-100 rounded-2xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">معلومات الرابط</h2>
              {getStatusBadge()}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  الاستخدامات
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {invitation.uses_count}
                  {invitation.max_uses && <span className="text-sm text-slate-500"> / {invitation.max_uses}</span>}
                </p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Calendar className="w-4 h-4" />
                  تاريخ الإنشاء
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(invitation.created_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
              
              {invitation.expires_at && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    ينتهي في
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(invitation.expires_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registered Users */}
        <Card className="bg-white border border-slate-100 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">المسجلون عبر هذا الرابط</h2>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm">
                {users.length} مسجل
              </span>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">لا يوجد مسجلون عبر هذا الرابط حتى الآن</p>
                <p className="text-xs text-slate-400 mt-2">
                  سيظهر هنا الطلاب الذين يسجلون باستخدام هذا الرابط
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user.name ? user.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name || 'بدون اسم'}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
