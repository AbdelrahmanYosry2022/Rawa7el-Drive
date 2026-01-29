import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Loader2
} from 'lucide-react';

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  speakers: { name: string; topic?: string }[] | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
};

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function StudentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Get the start and end of the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

      const { data, error } = await supabase
        .from('CalendarEvent')
        .select('*')
        .gte('date', startOfMonth.split('T')[0])
        .lte('date', endOfMonth.split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const selectedDayEvents = selectedDate
    ? getEventsForDay(selectedDate.getDate())
    : [];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">تقويم الحضور</h1>
          <p className="text-slate-500 font-medium text-lg">تابع جدول المحاضرات واللقاءات الخاصة بك</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold">عرض فقط</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <CardContent className="p-8">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-3 rounded-2xl hover:bg-slate-50 text-slate-600 transition-all border border-transparent hover:border-slate-100"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-black text-slate-800">
                  {MONTHS_AR[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-3 rounded-2xl hover:bg-slate-50 text-slate-600 transition-all border border-transparent hover:border-slate-100"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {DAYS_AR.map(day => (
                  <div key={day} className="text-center text-sm font-bold text-slate-400 py-2 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                  if (day === null) {
                    return <div key={idx} className="aspect-square" />;
                  }

                  const dayEvents = getEventsForDay(day);
                  const isSelected = selectedDate?.getDate() === day &&
                    selectedDate?.getMonth() === currentDate.getMonth() &&
                    selectedDate?.getFullYear() === currentDate.getFullYear();
                  const isToday = new Date().getDate() === day &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                      className={`
                        aspect-square rounded-2xl p-2 flex flex-col items-center justify-center
                        transition-all duration-300 relative group
                        ${isSelected ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'hover:bg-slate-50'}
                        ${isToday && !isSelected ? 'border-2 border-emerald-500 text-emerald-600 font-black' : ''}
                      `}
                    >
                      <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-emerald-500'}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm sticky top-24">
            <CardContent className="p-8">
              {selectedDate ? (
                <>
                  <div className="mb-8 pb-6 border-b border-slate-50">
                    <h3 className="text-xl font-black text-slate-800 mb-1">
                      {DAYS_AR[selectedDate.getDay()]}
                    </h3>
                    <p className="text-slate-500 font-bold">
                      {selectedDate.getDate()} {MONTHS_AR[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                    </p>
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                      <p className="text-slate-500 font-medium">جاري التحميل...</p>
                    </div>
                  ) : selectedDayEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-bold">لا توجد مواعيد في هذا اليوم</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedDayEvents.map(event => (
                        <div
                          key={event.id}
                          className={`p-6 rounded-3xl border-2 transition-all ${
                            event.status === 'COMPLETED'
                              ? 'bg-green-50/50 border-green-100'
                              : event.status === 'CANCELLED'
                              ? 'bg-red-50/50 border-red-100'
                              : 'bg-slate-50/50 border-slate-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="font-black text-slate-800 leading-tight">{event.title}</h4>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              event.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : event.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {event.status === 'COMPLETED' ? 'تمت' :
                               event.status === 'CANCELLED' ? 'ملغية' : 'مجدولة'}
                            </span>
                          </div>

                          {event.description && (
                            <p className="text-sm text-slate-600 font-medium mb-4 leading-relaxed line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          <div className="space-y-3">
                            {event.startTime && (
                              <div className="flex items-center gap-3 text-slate-500">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                  <Clock className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="text-sm font-bold">
                                  {event.startTime} {event.endTime && ` - ${event.endTime}`}
                                </span>
                              </div>
                            )}

                            {event.location && (
                              <div className="flex items-center gap-3 text-slate-500">
                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                  <MapPin className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="text-sm font-bold">{event.location}</span>
                              </div>
                            )}

                            {event.speakers && event.speakers.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                  <Users className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">المحاضرون</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {event.speakers.map((speaker, idx) => (
                                    <div key={idx} className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                                      <span className="text-sm font-bold text-slate-700">{speaker.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold">اختر يوماً لعرض التفاصيل</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
