// @ts-nocheck
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  PlayCircle,
  Trophy,
  Gift,
  Gamepad2,
  Timer
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Mock Data for Feb 2026
const SPECIAL_LECTURE_DATE = '2026-02-01';

type LectureContent = {
  theory: string;
  videoUrl: string;
  gameUrl: string;
  puzzle: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  type: 'regular' | 'practical' | 'special'; // Added types
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  content?: LectureContent;
  points: number;
  isCompleted?: boolean;
};

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export default function CalendarPage() {
  // Initialize to February 2026 as requested
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Feb is month 1 (0-indexed)
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<CalendarEvent | null>(null);
  const [showLectureSidebar, setShowLectureSidebar] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [countdown, setCountdown] = useState<string>('');

  // Mock specific data for the task
  useEffect(() => {
    // Mock events
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'نظرية تاليس',
        description: 'درس تفاعلي عن نظرية تاليس الهندسية وتطبيقاتها العملية',
        date: '2026-02-01',
        startTime: '10:00',
        endTime: '11:30',
        type: 'practical', // Green neon
        status: 'SCHEDULED',
        points: 50,
        content: {
          theory: 'إذا قطع مستقيمان عدة مستقيمات متوازية، فإن أطوال القطع المقابلة على أحد القاطعين تكون متناسبة مع أطوال القطع المقابلة على القاطع الآخر.',
          videoUrl: 'https://example.com/thales-video',
          gameUrl: '/games/interior-designer',
          puzzle: 'س = 80'
        }
      },
      {
        id: '2',
        title: 'جبر متقدم',
        description: 'حل معادلات الدرجة الثانية',
        date: '2026-02-08',
        startTime: '09:00',
        endTime: '10:30',
        type: 'regular',
        status: 'SCHEDULED',
        points: 30
      }
    ];
    setEvents(mockEvents);
    setIsLoading(false);

    // Countdown Timer Logic (Mocking time relative to Feb 1st 2026 or just a visual timer)
    const timer = setInterval(() => {
      const now = new Date();
      // For demo purposes, let's just show a static countdown or a real one to a future date
      // If we are testing "today", let's make it look active.
      setCountdown('00:45:30');
    }, 1000);

    return () => clearInterval(timer);
  }, [currentDate]);

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

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === dateStr);

    if (dayEvents.length > 0) {
      setSelectedLecture(dayEvents[0]);
      setShowLectureSidebar(true);
    }

    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const handleJoinLecture = () => {
    // XP Logic
    setUserPoints(prev => prev + 20); // Immediate XP for joining
    alert('تم تسجيل حضورك! حصلت على 20 نقطة XP 🌟');
  };

  const handleCompletePuzzle = () => {
    // Reward Logic
    if (selectedLecture && !selectedLecture.isCompleted) {
      setUserPoints(prev => prev + 50); // Lumina coins value
      const updatedEvents = events.map(e =>
        e.id === selectedLecture.id ? { ...e, isCompleted: true } : e
      );
      setEvents(updatedEvents);
      setSelectedLecture(prev => prev ? { ...prev, isCompleted: true } : null);
      alert('🎉 مبروك! حللت اللغز وحصلت على عملات لومينا!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-[Cairo]" dir="rtl">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all group">
            <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-emerald-600" />
              تقويم المحاضرات 2026
            </h1>
            <p className="text-slate-500 mt-1">جدول محاضرات مشروع بداية</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-slate-700">{userPoints} XP</span>
          </div>
          <Link to="/lectures">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <BookOpen className="w-4 h-4" />
              إدارة المحاضرات
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <CardContent className="p-6 text-center">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">اختر يوماً لعرض المحاضرات</h3>
              <p className="text-sm text-slate-500">انقر على الأيام الملونة في التقويم</p>
            </CardContent>
          </Card>

          {/* Upcoming Lectures Countdown */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                المحاضرات القادمة
              </h3>
              <div className="text-center py-4">
                <div className="text-4xl font-mono font-bold tracking-wider mb-2">{countdown}</div>
                <p className="text-indigo-200 text-sm">متبقي على بدء الحصة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-bold text-slate-800">
                {MONTHS_AR[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Days Header */}
              <div className="grid grid-cols-7 mb-4 text-center">
                {DAYS_AR.map(day => (
                  <div key={day} className="text-sm font-medium text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(currentDate).map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} className="aspect-square" />;

                  const dayEvents = getEventsForDay(day);
                  const hasEvents = dayEvents.length > 0;
                  const isPractical = dayEvents.some(e => e.type === 'practical');

                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      className={`
                                    aspect-square rounded-2xl flex items-center justify-center text-sm font-medium transition-all duration-300 relative group
                                    ${hasEvents
                          ? isPractical
                            ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 ring-2 ring-emerald-300 ring-offset-2'
                            : 'bg-indigo-500 text-white shadow-lg hover:bg-indigo-600'
                          : 'hover:bg-slate-50 text-slate-700'
                        }
                                `}
                    >
                      {day}
                      {hasEvents && (
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Lecture Sidebar */}
      {showLectureSidebar && selectedLecture && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowLectureSidebar(false)} />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setShowLectureSidebar(false)}
              className="absolute top-4 left-4 p-2 hover:bg-slate-100 rounded-full"
            >
              <X className="w-6 h-6 text-slate-500" />
            </button>

            <div className="mt-8 space-y-8">
              {/* Header */}
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3
                            ${selectedLecture.type === 'practical' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}
                        `}>
                  {selectedLecture.type === 'practical' ? 'محاضرة تفاعلية' : 'محاضرة نظرية'}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedLecture.title}</h2>
                <div className="flex items-center text-slate-500 text-sm gap-4">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedLecture.startTime}</span>
                  <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {selectedLecture.date}</span>
                </div>
              </div>

              {/* Join Button */}
              <Button
                onClick={handleJoinLecture}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all transform hover:-translate-y-1"
              >
                دخول المحاضرة الآن
                <ArrowRight className="mr-2 w-5 h-5" />
              </Button>

              {/* Content Flow */}
              {selectedLecture.content && (
                <div className="space-y-6 relative before:absolute before:right-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">

                  {/* Step 1: Theory */}
                  <div className="relative pr-10">
                    <div className="absolute right-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center z-10">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">نص النظرية</h4>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                      {selectedLecture.content.theory}
                    </p>
                  </div>

                  {/* Step 2: Video */}
                  <div className="relative pr-10">
                    <div className="absolute right-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center z-10">
                      <PlayCircle className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">فيديو الشرح</h4>
                    <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer group">
                      <PlayCircle className="w-12 h-12 text-white/50 group-hover:text-white transition-colors" />
                    </div>
                  </div>

                  {/* Step 3: Game */}
                  <div className="relative pr-10">
                    <div className="absolute right-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center z-10">
                      <Gamepad2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">لعبة "مهندس الديكور"</h4>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                      <p className="text-sm text-emerald-800 mb-3">طبق النظرية في تصميم غرفة حقيقية!</p>
                      <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                        بدء اللعبة
                      </Button>
                    </div>
                  </div>

                  {/* Step 4: Puzzle & Reward */}
                  <div className="relative pr-10">
                    <div className="absolute right-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-yellow-500 flex items-center justify-center z-10">
                      <Gift className="w-4 h-4 text-yellow-500" />
                    </div>
                    <h4 className="font-bold text-slate-900 mb-2">تحدي {selectedLecture.content.puzzle}</h4>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 rounded-lg p-4 text-center">
                      {!selectedLecture.isCompleted ? (
                        <>
                          <p className="text-sm text-yellow-800 mb-3">أوجد قيمة س للحصول على المكافأة</p>
                          <Button onClick={handleCompletePuzzle} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white border-none">
                            حل اللغز واستلام الهدية
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300">
                          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-yellow-600" />
                          </div>
                          <p className="font-bold text-yellow-700">تم استلام المكافأة!</p>
                          <p className="text-xs text-yellow-600">+50 عملة لومينا</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
