'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import { Input } from '@rawa7el/ui/input';
import { Student } from '../../lib/lms';
import { Trash2, UserPlus, ArrowLeft, Users, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@rawa7el/ui/dialog';

export default function StudentsPage() {
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setStudents(Student.getStudentsList());
  }, []);

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const newId = `student-${Date.now()}`;
    const newStudent = Student.createMockStudent(newId, newStudentName);
    newStudent.saveToStorage();
    setStudents(Student.getStudentsList());
    setNewStudentName('');
    setIsDialogOpen(false);
    toast.success('تم إضافة الطالب بنجاح');
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      Student.deleteStudent(id);
      setStudents(Student.getStudentsList());
      toast.success('تم حذف الطالب');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">إدارة الطلاب</h1>
              <p className="text-slate-500">عرض وإدارة جميع الطلاب المسجلين</p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="w-4 h-4" />
                إضافة طالب جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد</DialogTitle>
                <DialogDescription>أدخل اسم الطالب لإنشاء ملف جديد ببيانات تجريبية</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="اسم الطالب"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleAddStudent}>إضافة</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              قائمة الطلاب ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>لا يوجد طلاب مسجلين حالياً</p>
                <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                  إضافة أول طالب
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 group hover:border-emerald-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{student.name}</h3>
                        <p className="text-xs text-slate-500">ID: {student.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteStudent(student.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Link href={`/student/dashboard?studentId=${student.id}`} onClick={() => {
                        localStorage.setItem('bedaya-active-student-id', student.id);
                      }}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                          عرض اللوحة
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
