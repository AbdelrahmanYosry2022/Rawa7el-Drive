// 'use client' removed for Vite;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  QrCode,
  Loader2,
  AlertCircle
} from 'lucide-react';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;

interface Student {
  id: string;
  name: string;
  email: string;
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
}

interface Halaqa {
  id: string;
  name: string;
}

export default function AttendancePage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHalaqa, setSelectedHalaqa] = useState('all');
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchHalaqat();
    fetchStudents();
  }, []);

  // Re-fetch attendance when date changes
  useEffect(() => {
    if (students.length > 0) {
      fetchExistingAttendance();
    }
  }, [selectedDate, students]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchHalaqat = async () => {
    try {
      const { data, error } = await supabase
        .from('Halaqa')
        .select('id, name')
        .eq('isActive', true);
      if (!error && data) setHalaqat(data);
    } catch (err) {
      console.error('Error fetching halaqat:', err);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('User')
        .select('id, name, email')
        .eq('role', 'STUDENT')
        .eq('isActive', true)
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setStudents(data);
        // Initialize attendance state
        setAttendance(data.map((s: any) => ({ studentId: s.id, status: null })));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showNotification('error', 'حدث خطأ في تحميل بيانات الطلاب');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const dateStr = getFormattedDateForDB(selectedDate);
      // Find sessions for this date
      const { data: sessions, error: sessError } = await supabase
        .from('AttendanceSession')
        .select('id')
        .gte('date', `${dateStr}T00:00:00`)
        .lte('date', `${dateStr}T23:59:59`);

      if (sessError || !sessions || sessions.length === 0) {
        // No session for this date - reset all to null
        setAttendance(students.map((s: any) => ({ studentId: s.id, status: null })));
        return;
      }

      const sessionIds = sessions.map((s: any) => s.id);

      // Fetch attendance records for these sessions
      const { data: records, error: attError } = await supabase
        .from('Attendance')
        .select('userId, status')
        .in('sessionId', sessionIds);

      if (attError) throw attError;

      // Map existing records
      const recordMap: Record<string, AttendanceStatus> = {};
      (records || []).forEach((r: any) => {
        recordMap[r.userId] = r.status;
      });

      setAttendance(students.map((s: any) => ({
        studentId: s.id,
        status: recordMap[s.id] || null,
      })));
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
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
    setAttendance(prev => prev.map(record => ({ ...record, status: 'PRESENT' })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const now = new Date();
    const dateStr = getFormattedDateForDB(selectedDate);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showNotification('error', 'يجب تسجيل الدخول أولاً');
        setIsSaving(false);
        return;
      }

      // 1. Find or create session for this date
      const { data: existingSessions } = await supabase
        .from('AttendanceSession')
        .select('id')
        .gte('date', `${dateStr}T00:00:00`)
        .lte('date', `${dateStr}T23:59:59`);

      let sessionId: string;

      if (existingSessions && existingSessions.length > 0) {
        sessionId = existingSessions[0].id;
        // Delete existing attendance for this session
        await supabase
          .from('Attendance')
          .delete()
          .eq('sessionId', sessionId);
      } else {
        // Create new session
        const newId = crypto.randomUUID();
        const { error: sessError } = await supabase
          .from('AttendanceSession')
          .insert({
            id: newId,
            title: `حضور ${formatDate(selectedDate)}`,
            date: `${dateStr}T${now.toTimeString().slice(0, 8)}`,
            platform: 'BEDAYA',
            halaqaId: selectedHalaqa !== 'all' ? selectedHalaqa : null,
            createdAt: now.toISOString(),
          });
        if (sessError) throw sessError;
        sessionId = newId;
      }

      // 2. Insert attendance records
      const recordsToInsert = attendance
        .filter(a => a.status !== null)
        .map(a => ({
          id: crypto.randomUUID(),
          sessionId,
          userId: a.studentId,
          status: a.status,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        }));

      if (recordsToInsert.length > 0) {
        const { error } = await supabase
          .from('Attendance')
          .insert(recordsToInsert);

        if (error) throw error;
      }

      showNotification('success', 'تم حفظ الحضور بنجاح ✓');
    } catch (error) {
      console.error('Error saving attendance:', error);
      showNotification('error', 'حدث خطأ أثناء حفظ الحضور');
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

  // Filter students by halaqa if selected
  const filteredStudents = students;

  const stats = {
    present: attendance.filter(a => a.status === 'PRESENT').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    late: attendance.filter(a => a.status === 'LATE').length,
    excused: attendance.filter(a => a.status === 'EXCUSED').length,
    unmarked: attendance.filter(a => a.status === null).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </button>
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

      {/* QR Code Banner */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
        <Link to="/attendance/qr">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <QrCode className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">تسجيل الحضور بـ QR Code</h3>
                <p className="text-white/80 text-xs">أنشئ جلسة واعرض الكود للطلاب</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 rotate-180" />
          </div>
        </Link>
      </section>

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
        <div className="flex gap-2 flex-wrap">
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
            {halaqat.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Students List */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 pb-24">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">لا يوجد طلاب مسجلين</p>
            <p className="text-slate-400 text-sm mt-1">قم بإضافة طلاب أولاً من صفحة إدارة الطلاب</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="bg-white border border-slate-100 rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-600">
                          {student.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{student.name || 'بدون اسم'}</h4>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </div>

                    {/* Attendance Buttons */}
                    <div className="flex items-center gap-2">
                      {getStatusButton(
                        student.id,
                        'PRESENT',
                        <Check className="w-4 h-4" />,
                        'حاضر',
                        'bg-emerald-500'
                      )}
                      {getStatusButton(
                        student.id,
                        'ABSENT',
                        <X className="w-4 h-4" />,
                        'غائب',
                        'bg-red-500'
                      )}
                      {getStatusButton(
                        student.id,
                        'LATE',
                        <Clock className="w-4 h-4" />,
                        'متأخر',
                        'bg-amber-500'
                      )}
                      {getStatusButton(
                        student.id,
                        'EXCUSED',
                        <Users className="w-4 h-4" />,
                        'معذور',
                        'bg-blue-500'
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleSave}
            disabled={isSaving || stats.unmarked === filteredStudents.length}
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
