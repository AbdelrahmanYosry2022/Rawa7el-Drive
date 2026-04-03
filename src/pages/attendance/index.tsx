// Admin Attendance Page — Sessions list + Manual attendance + QR link

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck,
  ArrowRight,
  Check,
  X,
  Clock,
  Users,
  Save,
  QrCode,
  Loader2,
  AlertCircle,
  ListChecks,
  History,
  UserCheck,
  Timer,
  ChevronDown,
  Search,
  CalendarDays,
  Eye
} from 'lucide-react';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
type TabType = 'manual' | 'sessions';

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

interface SessionRecord {
  id: string;
  title: string | null;
  date: string;
  createdAt: string;
  endedAt: string | null;
  isActive: boolean | null;
  platform: string;
  attendeeCount: number;
}

// ─── Session detail modal ───
function SessionDetailModal({ session, onClose }: { session: SessionRecord; onClose: () => void }) {
  const [attendees, setAttendees] = useState<{ name: string; email: string; status: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await supabase
          .from('Attendance')
          .select('userId, status, createdAt')
          .eq('sessionId', session.id)
          .order('createdAt', { ascending: true });

        if (data && data.length > 0) {
          const userIds = data.map((d: any) => d.userId);
          const { data: users } = await supabase.from('User').select('id, name, email').in('id', userIds);
          const userMap: Record<string, any> = {};
          (users || []).forEach((u: any) => { userMap[u.id] = u; });

          setAttendees(data.map((d: any) => ({
            name: userMap[d.userId]?.name || 'طالب',
            email: userMap[d.userId]?.email || '',
            status: d.status,
            time: new Date(d.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          })));
        }
      } catch (err) {
        console.error('Error fetching session details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [session.id]);

  const statusLabel = (s: string) => {
    switch (s) {
      case 'PRESENT': return { text: 'حاضر', cls: 'bg-emerald-100 text-emerald-700' };
      case 'ABSENT': return { text: 'غائب', cls: 'bg-red-100 text-red-700' };
      case 'LATE': return { text: 'متأخر', cls: 'bg-amber-100 text-amber-700' };
      case 'EXCUSED': return { text: 'معذور', cls: 'bg-blue-100 text-blue-700' };
      default: return { text: s, cls: 'bg-slate-100 text-slate-700' };
    }
  };

  const duration = () => {
    if (!session.endedAt) return session.isActive ? 'جارية الآن' : '—';
    const start = new Date(session.createdAt).getTime();
    const end = new Date(session.endedAt).getTime();
    const mins = Math.round((end - start) / 60000);
    if (mins < 60) return `${mins} دقيقة`;
    return `${Math.floor(mins / 60)} ساعة ${mins % 60} دقيقة`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-slate-900">{session.title || 'جلسة حضور'}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {new Date(session.date).toLocaleDateString('ar-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(session.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              {duration()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {session.attendeeCount} حاضر
            </span>
          </div>
        </div>

        {/* Attendees list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">لا يوجد حاضرون في هذه الجلسة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendees.map((a, idx) => {
                const st = statusLabel(a.status);
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-black">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{a.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{a.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${st.cls}`}>{st.text}</span>
                    <span className="text-[11px] text-slate-400">{a.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [selectedHalaqa, setSelectedHalaqa] = useState('all');
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sessions tab state
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  useEffect(() => {
    fetchHalaqat();
    fetchStudents();
    fetchSessions();
  }, []);

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
        setAttendance(data.map((s: any) => ({ studentId: s.id, status: null })));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showNotification('error', 'حدث خطأ في تحميل بيانات الطلاب');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Fetch all sessions ───
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      // Try with new columns first; fall back to basic columns if they don't exist yet
      let sessData: any[] | null = null;
      const { data: d1, error: e1 } = await supabase
        .from('AttendanceSession')
        .select('id, title, date, createdAt, endedAt, isActive, platform')
        .order('createdAt', { ascending: false });

      if (!e1 && d1) {
        sessData = d1;
      } else {
        // Fallback: columns may not exist yet
        console.warn('Falling back to basic session columns:', e1?.message);
        const { data: d2, error: e2 } = await supabase
          .from('AttendanceSession')
          .select('id, title, date, createdAt, platform')
          .order('createdAt', { ascending: false });
        if (e2) throw e2;
        sessData = (d2 || []).map((s: any) => ({ ...s, endedAt: null, isActive: null }));
      }

      if (sessData && sessData.length > 0) {
        // Fetch attendee counts for each session
        const sessionIds = sessData.map((s: any) => s.id);
        const { data: attData } = await supabase
          .from('Attendance')
          .select('sessionId')
          .in('sessionId', sessionIds);

        const countMap: Record<string, number> = {};
        (attData || []).forEach((a: any) => {
          countMap[a.sessionId] = (countMap[a.sessionId] || 0) + 1;
        });

        setSessions(sessData.map((s: any) => ({
          ...s,
          endedAt: s.endedAt ?? null,
          isActive: s.isActive ?? null,
          attendeeCount: countMap[s.id] || 0,
        })));
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const setStudentAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev =>
      prev.map(record =>
        record.studentId === studentId
          ? { ...record, status: record.status === status ? null : status }
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showNotification('error', 'يجب تسجيل الدخول أولاً');
        setIsSaving(false);
        return;
      }

      // Create a new manual session
      const sessionId = crypto.randomUUID();
      const title = `تحضير يدوي — ${now.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' })}`;

      const { error: sessError } = await supabase
        .from('AttendanceSession')
        .insert({
          id: sessionId,
          title,
          date: now.toISOString(),
          startTime: now.toISOString(),
          platform: 'BEDAYA',
          halaqaId: selectedHalaqa !== 'all' ? selectedHalaqa : null,
          isActive: false,
          endedAt: now.toISOString(),
          createdAt: now.toISOString(),
        });
      if (sessError) throw sessError;

      // Insert attendance records
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
        const { error } = await supabase.from('Attendance').insert(recordsToInsert);
        if (error) throw error;
      }

      showNotification('success', 'تم حفظ الحضور بنجاح ✓');
      // Reset attendance
      setAttendance(students.map(s => ({ studentId: s.id, status: null })));
      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      console.error('Error saving attendance:', error);
      showNotification('error', 'حدث خطأ أثناء حفظ الحضور');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Filtered students ───
  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  const stats = {
    present: attendance.filter(a => a.status === 'PRESENT').length,
    absent: attendance.filter(a => a.status === 'ABSENT').length,
    late: attendance.filter(a => a.status === 'LATE').length,
    excused: attendance.filter(a => a.status === 'EXCUSED').length,
    unmarked: attendance.filter(a => a.status === null).length,
  };

  // ─── Session duration helper ───
  const getSessionDuration = (s: SessionRecord) => {
    if (!s.endedAt) return s.isActive ? 'جارية' : '—';
    const mins = Math.round((new Date(s.endedAt).getTime() - new Date(s.createdAt).getTime()) / 60000);
    if (mins < 1) return 'أقل من دقيقة';
    if (mins < 60) return `${mins} د`;
    return `${Math.floor(mins / 60)} س ${mins % 60} د`;
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

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}

      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
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
                <p className="text-xs text-slate-500">إدارة جلسات الحضور وتسجيل الطلاب</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* QR Code Banner */}
        <Link to="/attendance/qr">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 flex items-center justify-between text-white shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <QrCode className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">تسجيل الحضور بـ QR Code</h3>
                <p className="text-white/80 text-xs">أنشئ جلسة واعرض الكود أو الرقم للطلاب</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 rotate-180" />
          </div>
        </Link>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'sessions'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            سجل الجلسات
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            تحضير يدوي
          </button>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* SESSIONS TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-white border border-slate-100 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-indigo-600">{sessions.length}</p>
                  <p className="text-xs text-slate-500 mt-1">إجمالي الجلسات</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-100 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-emerald-600">
                    {sessions.filter(s => s.isActive).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">جلسات نشطة</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-100 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-black text-purple-600">
                    {sessions.reduce((sum, s) => sum + s.attendeeCount, 0)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">إجمالي التسجيلات</p>
                </CardContent>
              </Card>
            </div>

            {/* Sessions list */}
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">لا توجد جلسات حضور بعد</p>
                <p className="text-slate-400 text-sm mt-1">أنشئ جلسة من QR Code أو سجّل حضور يدوي</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <Card
                    key={s.id}
                    className="bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all cursor-pointer"
                    onClick={() => setSelectedSession(s)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          s.isActive
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {s.isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{s.title || 'جلسة حضور'}</h4>
                            {s.isActive && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">
                                نشطة
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {new Date(s.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', weekday: 'short' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(s.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {getSessionDuration(s)}
                            </span>
                          </div>
                        </div>

                        {/* Attendee count + arrow */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl">
                            <UserCheck className="w-4 h-4" />
                            <span className="font-bold text-sm">{s.attendeeCount}</span>
                          </div>
                          <Eye className="w-4 h-4 text-slate-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* MANUAL ATTENDANCE TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'manual' && (
          <div className="space-y-4 pb-28">
            {/* Stats bar */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { label: 'حاضر', value: stats.present, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                { label: 'غائب', value: stats.absent, cls: 'bg-red-100 text-red-700 border-red-200' },
                { label: 'متأخر', value: stats.late, cls: 'bg-amber-100 text-amber-700 border-amber-200' },
                { label: 'معذور', value: stats.excused, cls: 'bg-blue-100 text-blue-700 border-blue-200' },
                { label: 'بدون', value: stats.unmarked, cls: 'bg-slate-100 text-slate-600 border-slate-200' },
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap ${s.cls}`}>
                  <span>{s.value}</span>
                  <span className="font-medium">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[180px] relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن طالب..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-9 pr-9 pl-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <Button variant="outline" size="sm" onClick={markAllPresent} className="rounded-xl text-xs h-9">
                <Check className="w-3 h-3 ml-1" />
                تحضير الكل
              </Button>
              <div className="relative">
                <select
                  value={selectedHalaqa}
                  onChange={(e) => setSelectedHalaqa(e.target.value)}
                  className="h-9 pl-7 pr-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="all">كل المجموعات</option>
                  {halaqat.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">
                  {searchQuery ? 'لا توجد نتائج' : 'لا يوجد طلاب مسجلين'}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
                {filteredStudents.map((student, idx) => {
                  const currentStatus = attendance.find(a => a.studentId === student.id)?.status;
                  return (
                    <div key={student.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                      {/* Number */}
                      <span className="text-xs font-bold text-slate-300 w-5 text-center flex-shrink-0">{idx + 1}</span>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-indigo-600">
                          {student.name?.charAt(0) || '?'}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm truncate">{student.name || 'بدون اسم'}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                      </div>

                      {/* Status pills */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {([
                          { status: 'PRESENT' as AttendanceStatus, icon: <Check className="w-3.5 h-3.5" />, label: 'حاضر', active: 'bg-emerald-500 text-white shadow-emerald-200', inactive: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
                          { status: 'ABSENT' as AttendanceStatus, icon: <X className="w-3.5 h-3.5" />, label: 'غائب', active: 'bg-red-500 text-white shadow-red-200', inactive: 'bg-red-50 text-red-500 hover:bg-red-100' },
                          { status: 'LATE' as AttendanceStatus, icon: <Clock className="w-3.5 h-3.5" />, label: 'متأخر', active: 'bg-amber-500 text-white shadow-amber-200', inactive: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
                          { status: 'EXCUSED' as AttendanceStatus, icon: <Users className="w-3.5 h-3.5" />, label: 'معذور', active: 'bg-blue-500 text-white shadow-blue-200', inactive: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                        ]).map(btn => (
                          <button
                            key={btn.status}
                            onClick={() => setStudentAttendance(student.id, btn.status)}
                            title={btn.label}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              currentStatus === btn.status
                                ? `${btn.active} shadow-sm scale-110`
                                : btn.inactive
                            }`}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save Button — fixed bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 p-4 z-30">
              <div className="max-w-5xl mx-auto flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || stats.unmarked === students.length}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-5"
                >
                  <Save className="w-5 h-5 ml-2" />
                  {isSaving ? 'جاري الحفظ...' : 'حفظ الحضور'}
                </Button>
                {stats.unmarked > 0 && stats.unmarked < students.length && (
                  <span className="text-xs text-amber-600 whitespace-nowrap">
                    {stats.unmarked} بدون تحديد
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
