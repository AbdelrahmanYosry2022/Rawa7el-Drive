// 'use client' removed for Vite;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck,
  ArrowRight,
  Calendar,
  Check,
  X,
  Clock,
  Users,
  Save,
  ChevronLeft,
  ChevronRight,
  QrCode
} from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | null;

interface Student {
  id: string;
  name: string;
  halaqa?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHalaqa, setSelectedHalaqa] = useState('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*');

      if (error) throw error;

      if (data) {
        setStudents(data);
        // Initialize attendance state for new students
        setAttendance(data.map((s: any) => ({ studentId: s.id, status: null })));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFormattedDateForDB = (date: Date) => {
    return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const setStudentAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev =>
      prev.map(record =>
        record.studentId === studentId
          ? { ...record, status }
          : record
      )
    );
  };

  const markAllPresent = () => {
    setAttendance(prev => prev.map(record => ({ ...record, status: 'present' })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const dateStr = getFormattedDateForDB(selectedDate);

    try {
      // 1. Delete existing records for this date
      await supabase
        .from('attendance')
        .delete()
        .eq('date', dateStr);

      // 2. Insert new records
      const recordsToInsert = attendance
        .filter(a => a.status !== null)
        .map(a => ({
          student_id: a.studentId,
          status: a.status,
          date: dateStr,
          created_at: new Date().toISOString()
        }));

      if (recordsToInsert.length > 0) {
        const { error } = await supabase
          .from('attendance')
          .insert(recordsToInsert);

        if (error) throw error;
      }

      alert('تم حفظ الحضور بنجاح');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('حدث خطأ أثناء حفظ الحضور');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusButton = (studentId: string, status: AttendanceStatus, icon: React.ReactNode, label: string, color: string) => {
    const currentStatus = attendance.find(a => a.studentId === studentId)?.status;
    const isActive = currentStatus === status;

    return (
      <button
        onClick={() => setStudentAttendance(studentId, status)}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive
            ? `${color} text-white shadow-lg scale-105`
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
      >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
    unmarked: attendance.filter(a => a.status === null).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">الحضور والغياب</h1>
                <p className="text-xs text-slate-500">تسجيل حضور الطلاب</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Date Selector */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <Card className="bg-white border border-slate-100 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-slate-900">{formatDate(selectedDate)}</span>
              </div>

              <button
                onClick={() => changeDate(1)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                disabled={selectedDate >= new Date()}
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 pb-4">
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'حاضر', value: stats.present, color: 'bg-emerald-500' },
            { label: 'غائب', value: stats.absent, color: 'bg-red-500' },
            { label: 'متأخر', value: stats.late, color: 'bg-amber-500' },
            { label: 'معذور', value: stats.excused, color: 'bg-blue-500' },
            { label: 'غير محدد', value: stats.unmarked, color: 'bg-slate-400' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className={`${stat.color} text-white text-lg font-bold rounded-xl py-2`}>
                {stat.value}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 pb-4">
        <div className="flex gap-2">
          <Link to="/attendance/qr">
            <Button
              variant="default"
              size="sm"
              className="rounded-xl text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
            >
              <QrCode className="w-3 h-3 ml-1" />
              تسجيل بـ QR
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={markAllPresent}
            className="rounded-xl text-xs"
          >
            <Check className="w-3 h-3 ml-1" />
            تحضير الكل
          </Button>
          <select
            value={selectedHalaqa}
            onChange={(e) => setSelectedHalaqa(e.target.value)}
            className="h-8 px-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">جميع المجموعات</option>
            <option value="group-1">المجموعة الأولى</option>
            <option value="group-2">المجموعة الثانية</option>
          </select>
        </div>
      </section>

      {/* Students List */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 pb-24">
        <div className="space-y-3">
          {students.map((student) => {
            // studentAttendance available via: attendance.find(a => a.studentId === student.id)
            return (
              <Card key={student.id} className="bg-white border border-slate-100 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-600">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{student.name}</h4>
                        <p className="text-xs text-slate-500">{student.halaqa}</p>
                      </div>
                    </div>

                    {/* Attendance Buttons */}
                    <div className="flex items-center gap-2">
                      {getStatusButton(
                        student.id,
                        'present',
                        <Check className="w-4 h-4" />,
                        'حاضر',
                        'bg-emerald-500'
                      )}
                      {getStatusButton(
                        student.id,
                        'absent',
                        <X className="w-4 h-4" />,
                        'غائب',
                        'bg-red-500'
                      )}
                      {getStatusButton(
                        student.id,
                        'late',
                        <Clock className="w-4 h-4" />,
                        'متأخر',
                        'bg-amber-500'
                      )}
                      {getStatusButton(
                        student.id,
                        'excused',
                        <Users className="w-4 h-4" />,
                        'معذور',
                        'bg-blue-500'
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleSave}
            disabled={isSaving || stats.unmarked > 0}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-6"
          >
            <Save className="w-5 h-5 ml-2" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الحضور'}
          </Button>
          {stats.unmarked > 0 && (
            <p className="text-center text-xs text-amber-600 mt-2">
              يوجد {stats.unmarked} طالب لم يتم تحديد حضورهم
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
