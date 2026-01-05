'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@rawa7el/supabase/client'
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Shield, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen,
  Loader2,
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  Phone
} from 'lucide-react'

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT'
type Platform = 'BEDAYA' | 'TAHT_EL_ESHREEN' | 'PORTAL'

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: Role
  platform: Platform
  isActive: boolean
  createdAt: string
}

const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: 'مدير عام',
  ADMIN: 'مدير',
  TEACHER: 'معلم',
  STUDENT: 'طالب'
}

const roleIcons: Record<Role, React.ReactNode> = {
  SUPER_ADMIN: <ShieldCheck className="w-4 h-4" />,
  ADMIN: <Shield className="w-4 h-4" />,
  TEACHER: <BookOpen className="w-4 h-4" />,
  STUDENT: <GraduationCap className="w-4 h-4" />
}

const roleColors: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  TEACHER: 'bg-emerald-100 text-emerald-700',
  STUDENT: 'bg-gray-100 text-gray-700'
}

const platformLabels: Record<Platform, string> = {
  BEDAYA: 'بداية',
  TAHT_EL_ESHREEN: 'تحت العشرين',
  PORTAL: 'البوابة'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'STUDENT' as Role,
    platform: 'BEDAYA' as Platform
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      setError('فشل في تحميل المستخدمين')
      console.error(error)
    } else {
      setUsers(data || [])
    }
    setIsLoading(false)
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'STUDENT',
      platform: 'BEDAYA'
    })
    setIsModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      name: user.name || '',
      phone: user.phone || '',
      role: user.role,
      platform: user.platform
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('User')
          .update({
            name: formData.name || null,
            phone: formData.phone || null,
            role: formData.role,
            platform: formData.platform
          })
          .eq('id', editingUser.id)

        if (error) throw error
        setSuccess('تم تحديث المستخدم بنجاح')
      } else {
        // Create new user via API
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setSuccess('تم إنشاء المستخدم بنجاح')
      }

      closeModal()
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleUserStatus = async (user: User) => {
    const { error } = await supabase
      .from('User')
      .update({ isActive: !user.isActive })
      .eq('id', user.id)

    if (error) {
      setError('فشل في تحديث حالة المستخدم')
    } else {
      setSuccess(user.isActive ? 'تم تعطيل المستخدم' : 'تم تفعيل المستخدم')
      fetchUsers()
    }
  }

  const deleteUser = async (user: User) => {
    if (!confirm(`هل أنت متأكد من حذف ${user.name || user.email}؟`)) return

    const { error } = await supabase
      .from('User')
      .delete()
      .eq('id', user.id)

    if (error) {
      setError('فشل في حذف المستخدم')
    } else {
      setSuccess('تم حذف المستخدم بنجاح')
      fetchUsers()
    }
  }

  // Auto-hide messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error && !isModalOpen) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, isModalOpen])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
              <p className="text-gray-500 text-sm">{users.length} مستخدم</p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
          >
            <Plus className="w-5 h-5" />
            إضافة مستخدم
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            {success}
          </div>
        )}
        {error && !isModalOpen && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد مستخدمين</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">المستخدم</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الدور</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">المنصة</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الحالة</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{user.name || 'بدون اسم'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${roleColors[user.role]}`}>
                        {roleIcons[user.role]}
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {platformLabels[user.platform]}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleUserStatus(user)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          user.isActive 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {user.isActive ? 'نشط' : 'معطل'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                    className="w-full pr-11 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-left dir-ltr"
                  />
                </div>
              </div>

              {/* Password (only for new users) */}
              {!editingUser && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                      className="w-full pr-11 pl-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-left dir-ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">الاسم</label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pr-11 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pr-11 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-left dir-ltr"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">الدور</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">المنصة</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as Platform })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {Object.entries(platformLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  editingUser ? 'تحديث' : 'إضافة'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
