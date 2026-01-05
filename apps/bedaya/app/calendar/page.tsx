// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@rawa7el/supabase/client';
import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Clock,
  MapPin,
  Users,
  BookOpen,
  ArrowRight,
  X,
  Edit,
  Trash2,
  Check,
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
  creator?: { id: string; name: string };
};

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    speakers: [{ name: '', topic: '' }],
  });

  useEffect(() => {
    checkUserRole();
    fetchEvents();
  }, [currentDate]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Development mode: allow all users to manage calendar
      setIsAdmin(true);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const res = await fetch(`/api/calendar?month=${month}&year=${year}`);
    const data = await res.json();

    if (data.events) {
      setEvents(data.events);
    }
    setIsLoading(false);
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

  const openCreateModal = (date?: Date) => {
    setEditingEvent(null);
    const targetDate = date || new Date();
    setFormData({
      title: '',
      description: '',
      date: targetDate.toISOString().split('T')[0],
      startTime: '',
      endTime: '',
      location: '',
      speakers: [{ name: '', topic: '' }],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      speakers: event.speakers || [{ name: '', topic: '' }],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      speakers: formData.speakers.filter(s => s.name.trim()),
    };

    const url = editingEvent ? `/api/calendar/${editingEvent.id}` : '/api/calendar';
    const method = editingEvent ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchEvents();
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحدث؟')) return;

    const res = await fetch(`/api/calendar/${eventId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchEvents();
      setSelectedDate(null);
    }
  };

  const handleStatusChange = async (eventId: string, status: 'COMPLETED' | 'CANCELLED') => {
    const res = await fetch(`/api/calendar/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchEvents();
    }
  };

  const addSpeaker = () => {
    setFormData(prev => ({
      ...prev,
      speakers: [...prev.speakers, { name: '', topic: '' }],
    }));
  };

  const removeSpeaker = (index: number) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index),
    }));
  };

  const updateSpeaker = (index: number, field: 'name' | 'topic', value: string) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const days = getDaysInMonth(currentDate);
  const selectedDayEvents = selectedDate
    ? getEventsForDay(selectedDate.getDate())
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">تقويم المحاضرات</h1>
                <p className="text-xs text-slate-500">جدول محاضرات مشروع بداية</p>
              </div>
            </div>

            {isAdmin && (
              <Button
                onClick={() => openCreateModal()}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة محاضرة
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                  <h2 className="text-xl font-bold text-slate-900">
                    {MONTHS_AR[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_AR.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => {
                    if (day === null) {
                      return <div key={idx} className="aspect-square" />;
                    }

                    const dayEvents = getEventsForDay(day);
                    const isSelected = selectedDate?.getDate() === day &&
                      selectedDate?.getMonth() === currentDate.getMonth();
                    const isToday = new Date().getDate() === day &&
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getFullYear() === currentDate.getFullYear();

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                        className={`
                          aspect-square rounded-xl p-1 flex flex-col items-center justify-start
                          transition-all hover:bg-slate-50
                          ${isSelected ? 'bg-emerald-50 ring-2 ring-emerald-500' : ''}
                          ${isToday ? 'bg-emerald-500 text-white hover:bg-emerald-600' : ''}
                        `}
                      >
                        <span className={`text-sm font-medium ${isToday ? 'text-white' : ''}`}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-500'}`}
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

            {/* Upcoming Events List */}
            <Card className="bg-white border border-slate-100 rounded-2xl mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">المحاضرات القادمة</h3>
                {isLoading ? (
                  <div className="text-center py-8 text-slate-500">جاري التحميل...</div>
                ) : events.filter(e => e.status === 'SCHEDULED').length === 0 ? (
                  <div className="text-center py-8 text-slate-500">لا توجد محاضرات مجدولة</div>
                ) : (
                  <div className="space-y-4">
                    {events
                      .filter(e => e.status === 'SCHEDULED')
                      .slice(0, 5)
                      .map(event => (
                        <div
                          key={event.id}
                          className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => {
                            const eventDate = new Date(event.date);
                            setSelectedDate(eventDate);
                            setCurrentDate(eventDate);
                          }}
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-white">
                            <span className="text-xs">{MONTHS_AR[new Date(event.date).getMonth()].slice(0, 3)}</span>
                            <span className="text-lg font-bold">{new Date(event.date).getDate()}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{event.title}</h4>
                            {event.startTime && (
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {event.startTime}
                                {event.endTime && ` - ${event.endTime}`}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Day Details */}
          <div className="lg:col-span-1">
            <Card className="bg-white border border-slate-100 rounded-2xl sticky top-24">
              <CardContent className="p-6">
                {selectedDate ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {DAYS_AR[selectedDate.getDay()]}، {selectedDate.getDate()} {MONTHS_AR[selectedDate.getMonth()]}
                      </h3>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreateModal(selectedDate)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {selectedDayEvents.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>لا توجد محاضرات في هذا اليوم</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedDayEvents.map(event => (
                          <div
                            key={event.id}
                            className={`p-4 rounded-xl border-2 ${
                              event.status === 'COMPLETED'
                                ? 'bg-green-50 border-green-200'
                                : event.status === 'CANCELLED'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-slate-900">{event.title}</h4>
                              {isAdmin && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => openEditModal(event)}
                                    className="p-1 rounded hover:bg-slate-200"
                                  >
                                    <Edit className="w-4 h-4 text-slate-500" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(event.id)}
                                    className="p-1 rounded hover:bg-red-100"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {event.description && (
                              <p className="text-sm text-slate-600 mb-3">{event.description}</p>
                            )}

                            <div className="space-y-2 text-sm">
                              {event.startTime && (
                                <div className="flex items-center gap-2 text-slate-500">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {event.startTime}
                                    {event.endTime && ` - ${event.endTime}`}
                                  </span>
                                </div>
                              )}

                              {event.location && (
                                <div className="flex items-center gap-2 text-slate-500">
                                  <MapPin className="w-4 h-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}

                              {event.speakers && event.speakers.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                  <p className="font-medium text-slate-700 mb-2 flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    المحاضرون
                                  </p>
                                  <div className="space-y-1">
                                    {event.speakers.map((speaker, idx) => (
                                      <div key={idx} className="text-slate-600">
                                        <span className="font-medium">{speaker.name}</span>
                                        {speaker.topic && (
                                          <span className="text-slate-400"> - {speaker.topic}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {isAdmin && event.status === 'SCHEDULED' && (
                              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => handleStatusChange(event.id, 'COMPLETED')}
                                >
                                  <Check className="w-4 h-4 ml-1" />
                                  تم
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => handleStatusChange(event.id, 'CANCELLED')}
                                >
                                  <X className="w-4 h-4 ml-1" />
                                  إلغاء
                                </Button>
                              </div>
                            )}

                            {event.status !== 'SCHEDULED' && (
                              <div className={`mt-3 text-center text-sm font-medium ${
                                event.status === 'COMPLETED' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {event.status === 'COMPLETED' ? '✓ تمت المحاضرة' : '✗ تم الإلغاء'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>اختر يوماً لعرض المحاضرات</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingEvent ? 'تعديل المحاضرة' : 'إضافة محاضرة جديدة'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  عنوان المحاضرة *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="مثال: محاضرة في أصول الفقه"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                  placeholder="وصف مختصر للمحاضرة..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    التاريخ *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    المكان
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="مثال: قاعة المحاضرات"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    وقت البداية
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    وقت النهاية
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    المحاضرون
                  </label>
                  <button
                    type="button"
                    onClick={addSpeaker}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    + إضافة محاضر
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.speakers.map((speaker, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={speaker.name}
                        onChange={e => updateSpeaker(idx, 'name', e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="اسم المحاضر"
                      />
                      <input
                        type="text"
                        value={speaker.topic}
                        onChange={e => updateSpeaker(idx, 'topic', e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="موضوع المحاضرة"
                      />
                      {formData.speakers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSpeaker(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  {editingEvent ? 'حفظ التعديلات' : 'إضافة المحاضرة'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
