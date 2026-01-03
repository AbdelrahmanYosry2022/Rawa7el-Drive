'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import { Input } from '@rawa7el/ui/input';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Calendar,
  ArrowRight,
  BookOpen,
  Filter
} from 'lucide-react';

// Mock data - will be replaced with real data from database
const mockStudents = [
  { id: '1', name: 'أحمد محمد علي', phone: '0501234567', age: 12, halaqa: 'حلقة الفجر', joinDate: '2024-01-15', status: 'active' },
  { id: '2', name: 'محمد عبدالله سعيد', phone: '0507654321', age: 10, halaqa: 'حلقة العصر', joinDate: '2024-02-20', status: 'active' },
  { id: '3', name: 'عمر خالد أحمد', phone: '0509876543', age: 14, halaqa: 'حلقة الفجر', joinDate: '2024-03-10', status: 'inactive' },
];

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState(mockStudents);

  const filteredStudents = students.filter(student =>
    student.name.includes(searchQuery) || student.phone.includes(searchQuery)
  );

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">إدارة الطلاب</h1>
                <p className="text-xs text-slate-500">{students.length} طالب مسجل</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search & Actions */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="البحث عن طالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-white border-slate-200 rounded-xl"
            />
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl">
              <Filter className="w-4 h-4 ml-2" />
              تصفية
            </Button>
            <Link href="/students/new">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl">
                <UserPlus className="w-4 h-4 ml-2" />
                إضافة طالب
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Students List */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
        {filteredStudents.length === 0 ? (
          <Card className="bg-white border border-slate-100 rounded-2xl">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">لا يوجد طلاب</h3>
              <p className="text-slate-500 mb-6">ابدأ بإضافة طلاب جدد للحلقة</p>
              <Link href="/students/new">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl">
                  <UserPlus className="w-4 h-4 ml-2" />
                  إضافة أول طالب
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="bg-white border border-slate-100 rounded-2xl hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-emerald-600">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h4 className="font-semibold text-slate-900">{student.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="w-3 h-3" />
                            {student.phone}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <BookOpen className="w-3 h-3" />
                            {student.halaqa}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {student.age} سنة
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        student.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {student.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <Link href={`/students/${student.id}/edit`}>
                          <Button variant="ghost" size="sm" className="p-2 rounded-lg">
                            <Edit className="w-4 h-4 text-slate-500" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-2 rounded-lg hover:bg-red-50"
                          onClick={() => handleDelete(student.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
