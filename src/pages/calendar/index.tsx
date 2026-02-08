import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Clock,
  ArrowRight,
  X,
  Edit,
  Trash2,
  FileText,
  Loader2,
  Save
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
};

type EventForm = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
};

const EMPTY_FORM: EventForm = {
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  status: 'SCHEDULED',
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

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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

  const formatDateStr = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getEventsForDay = (day: number) => {
    const dateStr = formatDateStr(currentDate.getFullYear(), currentDate.getMonth(), day);
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

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setExpandedEvent(null);
  };

  const openAddModal = (date?: Date) => {
    const d = date || selectedDate || new Date();
    setEditingEvent(null);
    setForm({
      ...EMPTY_FORM,
      date: formatDateStr(d.getFullYear(), d.getMonth(), d.getDate()),
    });
    setShowModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      status: event.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        date: form.date,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        location: form.location.trim() || null,
        status: form.status,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('CalendarEvent')
          .update(payload)
          .eq('id', editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('CalendarEvent')
          .insert({ ...payload, createdBy: user.id });
        if (error) throw error;
      }

      setShowModal(false);
      setForm(EMPTY_FORM);
      setEditingEvent(null);
      await fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('CalendarEvent')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setDeleteConfirm(null);
      setExpandedEvent(null);
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const days = getDaysInMonth(currentDate);
  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate.getDate()) : [];
  const totalEventsThisMonth = events.length;
  const scheduledCount = events.filter(e => e.status === 'SCHEDULED').length;
  const completedCount = events.filter(e => e.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all group border border-slate-200">
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                التقويم
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
            >
              اليوم
            </button>
            <Button
              onClick={() => openAddModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl shadow-lg shadow-emerald-200 font-bold"
            >
              <Plus className="w-4 h-4" />
              إضافة يوم جديد
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'إجمالي الأيام', value: totalEventsThisMonth, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200' },
            { label: 'مجدول', value: scheduledCount, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-200' },
            { label: 'مكتمل', value: completedCount, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                <span className="text-white font-black text-lg">{stat.value}</span>
              </div>
              <span className="text-sm font-bold text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <CardContent className="p-0">
                {/* Month Navigation */}
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-all border border-transparent hover:border-slate-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-black text-slate-800">
                    {MONTHS_AR[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-all border border-transparent hover:border-slate-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  {/* Days Header */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {DAYS_AR.map(day => (
                      <div key={day} className="text-center text-xs font-black text-slate-400 py-2 uppercase tracking-wider">
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
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((day, idx) => {
                        if (day === null) return <div key={idx} className="aspect-square" />;

                        const dayEvents = getEventsForDay(day);
                        const hasEvents = dayEvents.length > 0;
                        const isSelected = selectedDate?.getDate() === day &&
                          selectedDate?.getMonth() === currentDate.getMonth() &&
                          selectedDate?.getFullYear() === currentDate.getFullYear();
                        const today = new Date();
                        const isToday = day === today.getDate() &&
                          currentDate.getMonth() === today.getMonth() &&
                          currentDate.getFullYear() === today.getFullYear();

                        return (
                          <button
                            key={idx}
                            onClick={() => handleDayClick(day)}
                            className={`
                              aspect-square rounded-2xl flex flex-col items-center justify-center
                              transition-all duration-200 relative group
                              ${isSelected
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.05] ring-2 ring-emerald-300 ring-offset-2'
                                : isToday
                                  ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-400 font-black'
                                  : hasEvents
                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                    : 'hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-100'
                              }
                            `}
                          >
                            <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>
                              {day}
                            </span>
                            {hasEvents && (
                              <div className="flex gap-0.5 mt-0.5">
                                {dayEvents.slice(0, 3).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-blue-500'}`}
                                  />
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Day Details */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  {selectedDate ? (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-black text-slate-800">
                            {DAYS_AR[selectedDate.getDay()]}
                          </h3>
                          <p className="text-slate-500 font-bold text-sm">
                            {selectedDate.getDate()} {MONTHS_AR[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                          </p>
                        </div>
                        <button
                          onClick={() => openAddModal(selectedDate)}
                          className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-all border border-emerald-200"
                          title="إضافة حدث لهذا اليوم"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      {selectedDayEvents.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CalendarIcon className="w-8 h-8 text-slate-300" />
                          </div>
                          <p className="text-slate-400 font-bold text-sm mb-4">لا توجد أحداث في هذا اليوم</p>
                          <button
                            onClick={() => openAddModal(selectedDate)}
                            className="text-emerald-600 text-sm font-bold hover:underline"
                          >
                            + إضافة حدث جديد
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedDayEvents.map(event => {
                            const statusInfo = STATUS_MAP[event.status];
                            const isExpanded = expandedEvent === event.id;

                            return (
                              <div
                                key={event.id}
                                className={`rounded-2xl border-2 transition-all overflow-hidden ${statusInfo.border} ${statusInfo.bg}`}
                              >
                                {/* Event Header */}
                                <div
                                  className="p-4 cursor-pointer"
                                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-black text-slate-800 text-sm leading-tight flex-1">{event.title}</h4>
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>

                                  {event.startTime && (
                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span className="font-bold">
                                        {event.startTime}{event.endTime && ` - ${event.endTime}`}
                                      </span>
                                    </div>
                                  )}

                                  {event.description && !isExpanded && (
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{event.description}</p>
                                  )}
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                  <div className="px-4 pb-4 space-y-3">
                                    {event.description && (
                                      <div className="bg-white/80 rounded-xl p-3 border border-slate-100">
                                        <div className="flex items-center gap-1.5 mb-2">
                                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">التفاصيل</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                                      </div>
                                    )}

                                    {event.location && (
                                      <p className="text-xs text-slate-500 font-bold">
                                        المكان: {event.location}
                                      </p>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openEditModal(event); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-600 text-xs font-bold border border-blue-200 transition-all"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                        تعديل
                                      </button>
                                      {deleteConfirm === event.id ? (
                                        <div className="flex-1 flex items-center gap-1">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                                            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-red-600 text-white text-xs font-bold transition-all"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            تأكيد
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                                            className="px-2 py-2 rounded-xl bg-white text-slate-500 text-xs font-bold border border-slate-200 transition-all"
                                          >
                                            إلغاء
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(event.id); }}
                                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-red-50 text-red-600 text-xs font-bold border border-red-200 transition-all"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          حذف
                                        </button>
                                      )}
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
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">اختر يوماً لعرض التفاصيل</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-100 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-black text-slate-800">
                {editingEvent ? 'تعديل الحدث' : 'إضافة يوم جديد'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان اليوم *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: محاضرة الرياضيات - الأسبوع الثالث"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-right"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  <FileText className="w-4 h-4 inline-block ml-1" />
                  وصف تفصيلي لليوم
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={"اكتب تفاصيل اليوم بالكامل... مثال:\n- موضوع المحاضرة\n- المهام المطلوبة\n- ملاحظات مهمة\n- الواجبات"}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-right resize-none leading-relaxed"
                />
                <p className="text-xs text-slate-400 mt-1.5 font-medium">هذا الوصف سيظهر للطلاب في التقويم الخاص بهم (للقراءة فقط)</p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">التاريخ *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">وقت البداية</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">وقت النهاية</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">المكان (اختياري)</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="مثال: القاعة الرئيسية"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-right"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الحالة</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map(status => {
                    const info = STATUS_MAP[status];
                    const isActive = form.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, status }))}
                        className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          isActive
                            ? `${info.bg} ${info.color} ${info.border} shadow-sm`
                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white rounded-b-3xl border-t border-slate-100 p-6 flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving || !form.title.trim() || !form.date}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold text-base shadow-lg shadow-emerald-200 disabled:opacity-50 gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {editingEvent ? 'حفظ التعديلات' : 'إضافة اليوم'}
              </Button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 h-12 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
