import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  createdAt: string;
  session: {
    title: string;
    date: string;
  };
}

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('Attendance')
        .select(`
          id,
          status,
          createdAt,
          session:AttendanceSession (
            title,
            date
          )
        `)
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((record: any) => ({
        id: record.id,
        status: record.status,
        createdAt: record.createdAt,
        session: {
          title: record.session?.title || 'جلسة غير محددة',
          date: record.session?.date || record.createdAt
        }
      }));

      setRecords(formattedData);

      // Calculate Stats
      const total = formattedData.length;
      const present = formattedData.filter(r => r.status === 'PRESENT').length;
      const late = formattedData.filter(r => r.status === 'LATE').length;
      const absent = formattedData.filter(r => r.status === 'ABSENT').length;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      setStats({ total, present, late, absent, percentage });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">حاضر</span>
          </div>
        );
      case 'LATE':
        return (
          <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-100">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">متأخر</span>
          </div>
        );
      case 'ABSENT':
        return (
          <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full flex items-center gap-1.5 border border-red-100">
            <XCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">غائب</span>
          </div>
        );
      default:
        return (
          <div className="bg-slate-50 text-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-100">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">غير محدد</span>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">سجل الحضور والغياب</h1>
          <p className="text-slate-500 font-medium text-lg">تتبع سجل حضورك ونسب الانضباط في البرنامج</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'نسبة الحضور', value: `${stats.percentage}%`, icon: ClipboardCheck, color: 'emerald' },
          { label: 'أيام الحضور', value: stats.present, icon: CheckCircle2, color: 'blue' },
          { label: 'أيام التأخير', value: stats.late, icon: Clock, color: 'amber' },
          { label: 'أيام الغياب', value: stats.absent, icon: XCircle, color: 'red' },
        ].map((stat, idx) => (
          <Card key={idx} className="bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-800 leading-none mb-1">{stat.value}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attendance Table */}
      <Card className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">تفاصيل السجل</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="بحث في الجلسات..." 
                  className="bg-slate-50 border-none rounded-xl py-2 pr-10 pl-4 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none w-full md:w-64"
                />
              </div>
              <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-colors">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">الجلسة</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">التاريخ</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">الحالة</th>
                  <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">وقت التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium">
                      لا يوجد سجل حضور مسجل حتى الآن
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <ClipboardCheck className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{record.session.title}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(record.session.date).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-8 py-5 text-slate-400 font-medium tabular-nums">
                        {new Date(record.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
