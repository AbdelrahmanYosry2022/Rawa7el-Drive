'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  FileText,
  Menu,
  X,
  User,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Search,
  MoreVertical,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Student, Lecture, Term } from '../../../lib/lms';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import { Input } from '@rawa7el/ui/input';
import { Badge } from '@rawa7el/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rawa7el/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@rawa7el/ui/dialog';
import { Progress } from '@rawa7el/ui/progress';
import { ModeToggle } from '@/components/mode-toggle';

// --- Types & Interfaces ---
type ViewType = 'overview' | 'lectures' | 'attendance' | 'exams' | 'assignments';

// --- Main Component ---
export default function StudentDashboard() {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Student Management States (for testing)
  const [allStudents, setAllStudents] = useState<{ id: string; name: string }[]>([]);
  const [isNewStudentOpen, setIsNewStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  // Load Initial Data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize mock data if empty
      const list = Student.getStudentsList();
      if (list.length === 0) {
        const mock = Student.createMockStudent();
        mock.saveToStorage();
      }
      setAllStudents(Student.getStudentsList());

      // Load first student or mock
      const currentId = list.length > 0 ? list[0].id : 'mock-1';
      const loadedStudent = Student.loadFromStorage(currentId);
      if (loadedStudent) {
        setStudent(loadedStudent);
      } else {
        // Fallback create
        const newMock = Student.createMockStudent();
        newMock.saveToStorage();
        setStudent(newMock);
      }
      setLoading(false);
    }
  }, []);

  // Handle Student Switching
  const switchStudent = (id: string) => {
    const s = Student.loadFromStorage(id);
    if (s) {
      setStudent(s);
      toast.success(`تم التبديل إلى الطالب: ${s.name}`);
    }
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const newId = `std-${Date.now()}`;
    const newStudent = new Student(newId, newStudentName, '01xxxxxxxxx');
    newStudent.saveToStorage();
    setAllStudents(Student.getStudentsList());
    setStudent(newStudent);
    setNewStudentName('');
    setIsNewStudentOpen(false);
    toast.success('تم إضافة الطالب بنجاح');
  };

  const handleDeleteStudent = (id: string) => {
    Student.deleteStudent(id);
    const updatedList = Student.getStudentsList();
    setAllStudents(updatedList);
    if (student?.id === id && updatedList.length > 0) {
      switchStudent(updatedList[0].id);
    } else if (updatedList.length === 0) {
      // Re-create mock if all deleted
      const mock = Student.createMockStudent();
      mock.saveToStorage();
      setAllStudents(Student.getStudentsList());
      setStudent(mock);
    }
    toast.success('تم حذف الطالب');
  };

  if (loading || !student) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex dir-rtl">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 right-0 z-50 h-screen w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out transform",
        isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-800 dark:text-slate-100">منصة بداية</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">للحلقات القرآنية</p>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="p-4 mx-4 mt-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
              {student.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{student.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">المستوى الثالث</p>
            </div>

            {/* Student Switcher Trigger */}
            <Dialog open={isNewStudentOpen} onOpenChange={setIsNewStudentOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                  <User className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إدارة الطلاب (للتطوير)</DialogTitle>
                  <DialogDescription>تبديل أو إضافة طلاب لاختبار النظام</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">إضافة طالب جديد</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="اسم الطالب"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                      />
                      <Button onClick={handleAddStudent}>
                        <Plus className="w-4 h-4 ml-2" /> إضافة
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الطلاب الحاليين</label>
                    <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-lg p-2">
                      {allStudents.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group">
                          <span className={cn("text-sm", s.id === student.id && "font-bold text-emerald-600")}>
                            {s.name}
                          </span>
                          <div className="flex gap-1">
                            {s.id !== student.id && (
                              <Button size="sm" variant="ghost" onClick={() => switchStudent(s.id)}>
                                تبديل
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteStudent(s.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 mt-6 space-y-1 overflow-y-auto">
            <SidebarItem
              icon={LayoutDashboard}
              label="ملخص عام"
              active={activeView === 'overview'}
              onClick={() => { setActiveView('overview'); setIsSidebarOpen(false); }}
            />
            <SidebarItem
              icon={BookOpen}
              label="المحاضرات"
              active={activeView === 'lectures'}
              onClick={() => { setActiveView('lectures'); setIsSidebarOpen(false); }}
            />
            <SidebarItem
              icon={CalendarCheck}
              label="الحضور والانصراف"
              active={activeView === 'attendance'}
              onClick={() => { setActiveView('attendance'); setIsSidebarOpen(false); }}
            />
            <SidebarItem
              icon={GraduationCap}
              label="الاختبارات"
              active={activeView === 'exams'}
              onClick={() => { setActiveView('exams'); setIsSidebarOpen(false); }}
            />
            <SidebarItem
              icon={FileText}
              label="التكليفات"
              active={activeView === 'assignments'}
              onClick={() => { setActiveView('assignments'); setIsSidebarOpen(false); }}
            />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="flex-1">
              <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-3" onClick={() => window.location.href = '/login'}>
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </Button>
            </div>
            <ModeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <BookOpen className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100">منصة بداية</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
          </Button>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {activeView === 'overview' && 'لوحة التحكم'}
                {activeView === 'lectures' && 'المواد الدراسية والمحاضرات'}
                {activeView === 'attendance' && 'سجل الحضور والغياب'}
                {activeView === 'exams' && 'الاختبارات والتقييمات'}
                {activeView === 'assignments' && 'التكليفات والواجبات'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {activeView === 'overview' && 'أهلاً بك، إليك ملخص لأدائك الدراسي'}
                {activeView === 'lectures' && 'تصفح جميع محاضراتك الدراسية مقسمة حسب المواد'}
                {activeView === 'attendance' && 'تابع سجل حضورك اليومي وحالات الغياب'}
                {activeView === 'exams' && 'اختباراتك الدورية والشاملة'}
                {activeView === 'assignments' && 'رفع ومتابعة تسليم التكليفات المطلوبة'}
              </p>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">التاريخ اليوم</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Content Views */}
          {activeView === 'overview' && <OverviewView student={student} setView={setActiveView} />}
          {activeView === 'lectures' && <LecturesView student={student} />}
          {activeView === 'attendance' && <AttendanceView student={student} />}
          {activeView === 'exams' && <ExamsView student={student} />}
          {activeView === 'assignments' && <AssignmentsView student={student} />}
        </div>
      </main>
    </div>
  );
}

// --- Sidebar Helper ---
function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1",
        active
          ? "bg-emerald-50 text-emerald-700 shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-emerald-600" : "text-slate-400")} />
      <span>{label}</span>
      {active && <ChevronRight className="w-4 h-4 mr-auto text-emerald-500" />}
    </button>
  );
}

// --- Views Components ---

function OverviewView({ student, setView }: { student: Student, setView: (v: ViewType) => void }) {
  // Calculate simple stats
  const terms = Object.values(student.terms);
  const totalLectures = terms.reduce((acc, t) => acc + t.lectures.length, 0);
  const completedLectures = terms.reduce((acc, t) => acc + t.lectures.filter(l => l.quizScore !== null).length, 0); // Assuming quiz done = lecture done
  const progress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1">المعدل التراكمي</p>
                <h3 className="text-3xl font-bold">95%</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 text-xs text-indigo-100 bg-white/10 inline-block px-2 py-1 rounded">ممتاز مرتفع</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">نسبة الحضور</p>
                <h3 className="text-3xl font-bold text-slate-800">92%</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CalendarCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="mt-4 text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> التزام ممتاز
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">المحاضرات المكتملة</p>
                <h3 className="text-3xl font-bold text-slate-800">{completedLectures}/{totalLectures}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Progress value={progress} className="mt-4 h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">التكليفات المعلقة</p>
                <h3 className="text-3xl font-bold text-slate-800">3</h3>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <Button variant="link" className="mt-2 h-auto p-0 text-orange-600 text-xs" onClick={() => setView('assignments')}>
              عرض التفاصيل
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100">الجدول الدراسي اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-200">09:00</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">تجويد - أحكام المدود</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">القاعة الرئيسية • الشيخ أحمد</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">جاري الآن</Badge>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 opacity-60">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <span className="font-medium text-slate-500 dark:text-slate-400">11:00</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">فقه - الطهارة</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">قاعة 3 • الشيخ محمد</p>
                </div>
                <Badge variant="outline" className="dark:text-slate-400 dark:border-slate-700">قادم</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-emerald-900 text-white">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div>
              <h3 className="font-bold text-xl mb-2">تذكير هام</h3>
              <p className="text-emerald-100 text-sm leading-relaxed">
                موعد الاختبار الشامل للترم الأول يقترب. يرجى مراجعة المحاضرات من 1 إلى 5.
              </p>
            </div>
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm text-emerald-200 mb-2">
                <Clock className="w-4 h-4" />
                <span>متبقي 3 أيام</span>
              </div>
              <Button className="w-full bg-white text-emerald-900 hover:bg-emerald-50" onClick={() => setView('exams')}>
                جدول الاختبارات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LecturesView({ student }: { student: Student }) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Extract unique subjects
  const allLectures: Lecture[] = Object.values(student.terms).flatMap(t => t.lectures);
  const subjects = Array.from(new Set(allLectures.map(l => l.subject).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Subject Selection */}
      {!selectedSubject ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(subject => (
            <Card
              key={subject}
              className="cursor-pointer hover:shadow-md transition-all border-slate-200 group"
              onClick={() => setSelectedSubject(subject)}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                  <BookOpen className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{subject}</h3>
                  <p className="text-sm text-slate-500">
                    {allLectures.filter(l => l.subject === subject).length} محاضرة
                  </p>
                </div>
                <ChevronRight className="mr-auto text-slate-300 group-hover:text-indigo-500" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedSubject(null)}
            className="gap-2 text-slate-600 hover:text-slate-900 p-0 hover:bg-transparent"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            عودة للمواد
          </Button>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">مادة: {selectedSubject}</h2>
          </div>

          <Tabs defaultValue="term-1" className="w-full">
            <TabsList className="w-full justify-start h-auto p-1 bg-slate-100 rounded-xl mb-6">
              <TabsTrigger value="term-1" className="flex-1 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">الترم الأول</TabsTrigger>
              <TabsTrigger value="term-2" className="flex-1 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">الترم الثاني</TabsTrigger>
              <TabsTrigger value="term-3" className="flex-1 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">الترم الثالث</TabsTrigger>
            </TabsList>

            {['term-1', 'term-2', 'term-3'].map(termId => {
              const term = student.terms[termId];
              const termLectures = term?.lectures.filter(l => l.subject === selectedSubject) || [];

              return (
                <TabsContent key={termId} value={termId} className="space-y-4">
                  {termLectures.length > 0 ? (
                    termLectures.map(lecture => (
                      <Card key={lecture.id} className="border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                            <span className="font-bold text-emerald-700">{lecture.id.split('-')[1]}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-lg">{lecture.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><CalendarCheck className="w-3 h-3" /> {lecture.date}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 45 دقيقة</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-4 sm:mt-0">
                            {lecture.hasQuiz && (
                              <Badge variant={lecture.quizScore ? "default" : "secondary"} className={cn(lecture.quizScore ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "")}>
                                {lecture.quizScore ? `درجة الكويز: ${lecture.quizScore}` : "كويز متاح"}
                              </Badge>
                            )}
                            <Button size="sm">مشاهدة</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>لا توجد محاضرات لهذه المادة في هذا الترم</p>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
    </div>
  );
}

function AttendanceView({ student }: { student: Student }) {
  // Aggregate all attendance
  const allAttendance = Object.values(student.terms)
    .flatMap(t => t.attendance)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle>سجل الحضور والغياب</CardTitle>
        <CardDescription>عرض تفصيلي لحالة الحضور اليومية في الحلقات</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4 rounded-r-lg">التاريخ</th>
                <th className="p-4">اليوم</th>
                <th className="p-4">وقت الحضور</th>
                <th className="p-4">وقت الانصراف</th>
                <th className="p-4 rounded-l-lg">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allAttendance.map((record, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-800">{record.date}</td>
                  <td className="p-4 text-slate-500">
                    {new Date(record.date).toLocaleDateString('ar-EG', { weekday: 'long' })}
                  </td>
                  <td className="p-4 text-slate-500">08:00 ص</td>
                  <td className="p-4 text-slate-500">12:30 م</td>
                  <td className="p-4">
                    <Badge className={cn(
                      "px-3 py-1",
                      record.status === 'present' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                      record.status === 'absent' && "bg-red-100 text-red-700 hover:bg-red-100",
                      record.status === 'excused' && "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
                    )}>
                      {record.status === 'present' && 'حاضر'}
                      {record.status === 'absent' && 'غائب'}
                      {record.status === 'excused' && 'بعذر'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ExamsView({ student }: { student: Student }) {
  return (
    <Tabs defaultValue="quizzes" className="w-full">
      <TabsList className="w-full sm:w-auto grid grid-cols-2 mb-6">
        <TabsTrigger value="quizzes">الكويزات القصيرة</TabsTrigger>
        <TabsTrigger value="finals">الامتحانات الشاملة</TabsTrigger>
      </TabsList>

      <TabsContent value="quizzes" className="space-y-4">
        {Object.values(student.terms).map(term => {
          const quizLectures = term.lectures.filter(l => l.hasQuiz);
          if (quizLectures.length === 0) return null;
          return (
            <div key={term.id} className="space-y-3">
              <h3 className="font-bold text-lg text-slate-700 px-2 border-r-4 border-emerald-500">{term.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizLectures.map(lecture => (
                  <Card key={lecture.id} className="border-slate-200">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800">{lecture.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{lecture.subject}</p>
                      </div>
                      <div className="text-left">
                        {lecture.quizScore ? (
                          <div className="text-center">
                            <span className="block text-2xl font-bold text-emerald-600">{lecture.quizScore}%</span>
                            <span className="text-xs text-emerald-600">تم الاختبار</span>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            بدء الاختبار
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </TabsContent>

      <TabsContent value="finals">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(student.terms).map(term => (
            <Card key={term.id} className="border-slate-200 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
              <CardHeader>
                <CardTitle>{term.name}</CardTitle>
                <CardDescription>الاختبار النهائي الشامل</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-4 flex justify-center">
                  {term.finalExam.score ? (
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full border-4 border-indigo-100 flex items-center justify-center mx-auto mb-2">
                        <span className="text-3xl font-bold text-indigo-600">{term.finalExam.score}%</span>
                      </div>
                      <Badge className="bg-indigo-100 text-indigo-700">ناجح</Badge>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <LockIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">لم يحن الموعد بعد</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function AssignmentsView({ student }: { student: Student }) {
  const [activeTab, setActiveTab] = useState("pending");

  const allAssignments = Object.values(student.terms).flatMap(t => t.lectures.filter(l => l.hasAssignment));
  const pending = allAssignments.filter(l => l.assignmentStatus === 'pending');
  const submitted = allAssignments.filter(l => l.assignmentStatus !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("pending")}
          className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "pending" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          قيد الانتظار ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab("submitted")}
          className={cn("px-4 py-2 text-sm font-medium border-b-2 transition-colors", activeTab === "submitted" ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700")}
        >
          تم التسليم ({submitted.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(activeTab === "pending" ? pending : submitted).map(lecture => (
          <Card key={lecture.id} className="border-slate-200">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{lecture.title}</h4>
                    <p className="text-sm text-slate-500">{lecture.subject}</p>
                  </div>
                </div>
                {lecture.assignmentStatus === 'graded' && (
                  <Badge className="bg-emerald-100 text-emerald-700">تم التصحيح</Badge>
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-4 border border-slate-100">
                المطلوب: تلخيص المحاضرة في صفحة واحدة ورفع الملف بصيغة PDF.
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> آخر موعد: {lecture.date}
                </div>
                {activeTab === "pending" ? (
                  <Button size="sm" className="gap-2">
                    <Upload className="w-4 h-4" /> رفع الملف
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="gap-2">
                    عرض الملف
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {(activeTab === "pending" ? pending : submitted).length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>لا توجد تكليفات في هذه القائمة</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
