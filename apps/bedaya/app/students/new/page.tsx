'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import { Input } from '@rawa7el/ui/input';
import { 
  UserPlus, 
  ArrowRight,
  User,
  Phone,
  Calendar,
  BookOpen,
  Save,
  X
} from 'lucide-react';

export default function NewStudentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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
      // TODO: Call API to create student
      console.log('Creating student:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/students');
    } catch (error) {
      console.error('Error creating student:', error);
    } finally {
      setIsLoading(false);
    }
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
            <Link href="/students" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
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
                    الحلقة
                  </label>
                  <select
                    name="halaqa"
                    value={formData.halaqa}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">اختر الحلقة</option>
                    <option value="halaqa-1">حلقة الفجر</option>
                    <option value="halaqa-2">حلقة العصر</option>
                    <option value="halaqa-3">حلقة المغرب</option>
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
                <Link href="/students">
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
    </div>
  );
}
