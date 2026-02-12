// 'use client' removed for Vite;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UserPlus,
  ArrowRight,
  User,
  Phone,
  Calendar,
  BookOpen,
  Save,
  X,
  Check
} from 'lucide-react';

export default function NewStudentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    guardianPhone: '',
    age: '',
    halaqa: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('students')
        .insert([
          {
            name: formData.name,
            phone: formData.phone,
            guardian_phone: formData.guardianPhone,
            age: formData.age ? parseInt(formData.age) : null,
            halaqa: formData.halaqa,
            notes: formData.notes,
            status: 'active',
            join_date: new Date().toISOString().split('T')[0]
          }
        ]);

      if (error) throw error;

      setShowToast(true);
      // Removed automatic navigation to show toast options
    } catch (error) {
      console.error('Error creating student:', error);
      alert('حدث خطأ أثناء إضافة الطالب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      guardianPhone: '',
      age: '',
      halaqa: '',
      notes: '',
    });
    setShowToast(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/students" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">إضافة طالب جديد</h1>
                <p className="text-xs text-slate-500">أدخل بيانات الطالب</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <form onSubmit={handleSubmit}>
          <Card className="bg-white border border-slate-100 rounded-2xl">
            <CardContent className="p-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <User className="w-4 h-4" />
                  اسم الطالب
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="أدخل اسم الطالب الكامل"
                  required
                  className="bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>

              {/* Phone Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Phone className="w-4 h-4" />
                    رقم الجوال
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="05xxxxxxxx"
                    className="bg-slate-50 border-slate-200 rounded-xl"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Phone className="w-4 h-4" />
                    رقم ولي الأمر
                  </label>
                  <Input
                    type="tel"
                    name="guardianPhone"
                    value={formData.guardianPhone}
                    onChange={handleChange}
                    placeholder="05xxxxxxxx"
                    required
                    className="bg-slate-50 border-slate-200 rounded-xl"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Age & Halaqa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Calendar className="w-4 h-4" />
                    العمر
                  </label>
                  <Input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="العمر بالسنوات"
                    min="4"
                    max="100"
                    required
                    className="bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <BookOpen className="w-4 h-4" />
                    المجموعة
                  </label>
                  <select
                    name="halaqa"
                    value={formData.halaqa}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">اختر المجموعة</option>
                    <option value="group-1">المجموعة الأولى</option>
                    <option value="group-2">المجموعة الثانية</option>
                    <option value="group-3">المجموعة الثالثة</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="أي ملاحظات إضافية عن الطالب..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link to="/students">
                  <Button type="button" variant="outline" className="rounded-xl">
                    <X className="w-4 h-4 ml-2" />
                    إلغاء
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl"
                >
                  <Save className="w-4 h-4 ml-2" />
                  {isLoading ? 'جاري الحفظ...' : 'حفظ الطالب'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </section>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto z-50 bg-white border border-emerald-100 shadow-xl rounded-2xl p-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">تمت إضافة الطالب بنجاح!</h4>
                <p className="text-sm text-slate-500">تم تحديث الإحصائيات في لوحة التحكم تلقائياً</p>
              </div>
            </div>
            <div className="flex gap-2 mr-13">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="rounded-lg border-slate-200 hover:bg-slate-50"
              >
                <UserPlus className="w-4 h-4 ml-2" />
                إضافة طالب آخر
              </Button>
              <Link to="/dashboard">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                  <ArrowRight className="w-4 h-4 ml-2" />
                  العودة للوحة التحكم
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
