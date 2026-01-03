'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import { 
  BookOpen, 
  ArrowRight,
  Plus,
  Users,
  Clock,
  MapPin,
  Edit,
  MoreVertical
} from 'lucide-react';

// Mock data
const mockHalaqat = [
  { 
    id: '1', 
    name: 'حلقة الفجر', 
    teacher: 'الشيخ أحمد محمد',
    time: 'بعد صلاة الفجر',
    location: 'مسجد النور',
    studentsCount: 15,
    status: 'active'
  },
  { 
    id: '2', 
    name: 'حلقة العصر', 
    teacher: 'الشيخ محمد علي',
    time: 'بعد صلاة العصر',
    location: 'مسجد الرحمة',
    studentsCount: 12,
    status: 'active'
  },
  { 
    id: '3', 
    name: 'حلقة المغرب', 
    teacher: 'الشيخ عبدالله سعيد',
    time: 'بعد صلاة المغرب',
    location: 'مسجد التقوى',
    studentsCount: 8,
    status: 'inactive'
  },
];

export default function HalaqatPage() {
  const [halaqat] = useState(mockHalaqat);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">الحلقات</h1>
                  <p className="text-xs text-slate-500">{halaqat.length} حلقة</p>
                </div>
              </div>
            </div>
            
            <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl">
              <Plus className="w-4 h-4 ml-2" />
              إضافة حلقة
            </Button>
          </div>
        </div>
      </header>

      {/* Halaqat List */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="grid gap-4">
          {halaqat.map((halaqa) => (
            <Card key={halaqa.id} className="bg-white border border-slate-100 rounded-2xl hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-bold text-slate-900">{halaqa.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        halaqa.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {halaqa.status === 'active' ? 'نشطة' : 'متوقفة'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{halaqa.teacher}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{halaqa.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{halaqa.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{halaqa.studentsCount} طالب</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="p-2 rounded-lg">
                      <Edit className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-2 rounded-lg">
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
