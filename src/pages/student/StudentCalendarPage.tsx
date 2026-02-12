import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  MapPin,
  FileText,
  Loader2,
  Eye
} from 'lucide-react';

const formatTime12h = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'م' : 'ص';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
};

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
};

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  SCHEDULED: { label: 'مجدول', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  COMPLETED: { label: 'مكتمل', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  CANCELLED: { label: 'ملغي', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

export default function StudentCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const startStr = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;
      const endStr = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('CalendarEvent')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr)
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
      if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1);
      else newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setSelectedDate(null);
    setExpandedEvent(null);
  };

  const days = getDaysInMonth(currentDate);
  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate.getDate()) : [];

  return (
    <div className="px-4 py-4 md:p-8 space-y-4 md:space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight mb-0.5 md:mb-2">التقويم</h1>
          <p className="text-slate-500 font-medium text-xs md:text-lg">تابع جدول المحاضرات واللقاءات</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl border border-emerald-100 flex items-center gap-1.5">
          <Eye className="w-4 h-4 md:w-5 md:h-5" />
          <span className="font-bold text-xs md:text-sm">عرض فقط</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-sm">
            <CardContent className="p-4 md:p-8">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4 md:mb-8">
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-slate-50 text-slate-600 transition-all"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <h2 className="text-lg md:text-2xl font-black text-slate-800">
                  {MONTHS_AR[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-slate-50 text-slate-600 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
                {DAYS_AR.map(day => (
                  <div key={day} className="text-center text-[10px] md:text-sm font-bold text-slate-400 py-1 md:py-2 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {days.map((day, idx) => {
                    if (day === null) return <div key={idx} className="aspect-square" />;

                    const dayEvents = getEventsForDay(day);
                    const hasEvents = dayEvents.length > 0;
                    const isSelected = selectedDate?.getDate() === day &&
                      selectedDate?.getMonth() === currentDate.getMonth() &&
                      selectedDate?.getFullYear() === currentDate.getFullYear();
                    const isToday = new Date().getDate() === day &&
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getFullYear() === currentDate.getFullYear();

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                          setExpandedEvent(null);
                        }}
                        className={`
                          aspect-square rounded-xl md:rounded-2xl p-1 md:p-2 flex flex-col items-center justify-center
                          transition-all duration-300 relative group
                          ${isSelected ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'hover:bg-slate-50'}
                          ${isToday && !isSelected ? 'border-2 border-emerald-500 text-emerald-600 font-black' : ''}
                          ${hasEvents && !isSelected ? 'bg-blue-50 border border-blue-200' : ''}
                        `}
                      >
                        <span className={`text-sm md:text-lg font-bold ${isSelected ? 'text-white' : hasEvents ? 'text-blue-700' : 'text-slate-700'}`}>
                          {day}
                        </span>
                        {hasEvents && (
                          <div className="flex gap-1 mt-1">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/60' : 'bg-blue-500'}`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Sidebar */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <Card className="bg-white border border-slate-100 rounded-2xl md:rounded-[2.5rem] shadow-sm md:sticky md:top-24">
            <CardContent className="p-5 md:p-8">
              {selectedDate ? (
                <>
                  <div className="mb-4 md:mb-8 pb-4 md:pb-6 border-b border-slate-50">
                    <h3 className="text-lg md:text-xl font-black text-slate-800 mb-1">
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
                      {selectedDayEvents.map(event => {
                        const statusInfo = STATUS_MAP[event.status];
                        const isExpanded = expandedEvent === event.id;

                        return (
                          <div
                            key={event.id}
                            className={`rounded-3xl border-2 transition-all overflow-hidden ${statusInfo.border} ${statusInfo.bg}`}
                          >
                            {/* Event Header */}
                            <div
                              className="p-5 cursor-pointer"
                              onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-black text-slate-800 leading-tight">{event.title}</h4>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
                                  {statusInfo.label}
                                </span>
                              </div>

                              {event.startTime && (
                                <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                                  <Clock className="w-4 h-4 text-emerald-600" />
                                  <span className="font-bold">
                                    {formatTime12h(event.startTime)}{event.endTime && ` - ${formatTime12h(event.endTime)}`}
                                  </span>
                                </div>
                              )}

                              {event.location && (
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                  <MapPin className="w-4 h-4 text-emerald-600" />
                                  <span className="font-bold">{event.location}</span>
                                </div>
                              )}

                              {event.description && !isExpanded && (
                                <p className="text-sm text-slate-600 mt-3 line-clamp-2 leading-relaxed">{event.description}</p>
                              )}

                              {event.description && (
                                <p className="text-xs text-emerald-600 font-bold mt-2">
                                  {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل الكاملة'}
                                </p>
                              )}
                            </div>

                            {/* Expanded Description */}
                            {isExpanded && event.description && (
                              <div className="px-5 pb-5">
                                <div className="bg-white/80 rounded-2xl p-4 border border-slate-100">
                                  <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">تفاصيل اليوم</span>
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
