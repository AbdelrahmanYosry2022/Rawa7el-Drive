'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rawa7el/ui/tabs';
import { Student } from '../../../lib/lms';

// Terms config for UI tabs
const TERMS_CONFIG = [
  { id: 'term-1', label: 'الترم الأول' },
  { id: 'term-2', label: 'الترم الثاني' },
  { id: 'term-3', label: 'الترم الثالث' },
];

export default function StudentDashboard() {
  const [activeTermId, setActiveTermId] = useState('term-1');
  const [student, setStudent] = useState<Student | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Initialize Data
  useEffect(() => {
    // Try to load from storage
    // For demo purposes, we'll use a hardcoded ID 'demo-student'
    const studentId = 'demo-student';
    let loadedStudent = Student.loadFromStorage(studentId);

    if (!loadedStudent) {
      // If no data exists, create a fresh mock student and save it
      loadedStudent = Student.createMockStudent();
      loadedStudent.id = studentId;
      loadedStudent.saveToStorage();
    }

    setStudent(loadedStudent);

    // Load active term preference
    const savedTerm = localStorage.getItem('student-active-term');
    if (savedTerm && ['term-1', 'term-2', 'term-3'].includes(savedTerm)) {
      setActiveTermId(savedTerm);
    }
  }, []);

  const handleTermChange = (value: string) => {
    setActiveTermId(value);
    localStorage.setItem('student-active-term', value);
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans" dir="rtl">
        <div className="animate-pulse flex flex-col items-center">
          <GraduationCap className="h-12 w-12 text-emerald-600 mb-4" />
          <p className="text-slate-500">جاري تحميل بيانات الطالب...</p>
        </div>
      </div>
    );
  }

  const activeTermData = student.getTerm(activeTermId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">منصة بداية</h1>
                <p className="text-xs text-slate-500">لوحة الطالب</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{student.name}</span>
              </div>
              <form action="/api/auth/signout" method="POST">
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل خروج
                </Button>
              </form>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="term-1" value={activeTermId} onValueChange={handleTermChange} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">الفصول الدراسية</h2>
            <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto">
              {TERMS_CONFIG.map((term) => (
                <TabsTrigger
                  key={term.id}
                  value={term.id}
                  className="px-6 py-2 rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
                >
                  {term.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTermId} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-emerald-100 text-sm mb-1">المحاضرات</p>
                      <h3 className="text-3xl font-bold">{activeTermData.lectures.length}</h3>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">نسبة الحضور</p>
                      <h3 className="text-3xl font-bold text-slate-800">
                        {activeTermData.getAttendancePercentage()}%
                      </h3>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <Clock className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">الواجبات المسلمة</p>
                      <h3 className="text-3xl font-bold text-slate-800">
                        {activeTermData.getSubmittedAssignmentsCount()}
                      </h3>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg">
                      <FileText className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lectures & Assignments Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    المحتوى التعليمي والتقييم
                  </h3>
                </div>

                {activeTermData.lectures.length > 0 ? (
                  <div className="space-y-4">
                    {activeTermData.lectures.map((lecture) => (
                      <Card key={lecture.id} className="border-slate-200 hover:border-emerald-200 transition-colors overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="bg-slate-50 p-6 flex flex-col justify-center items-center md:w-48 border-l border-slate-100">
                            <Calendar className="h-8 w-8 text-slate-400 mb-2" />
                            <span className="text-sm font-medium text-slate-600">{lecture.date}</span>
                          </div>
                          <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-slate-800 mb-1">{lecture.title}</h4>
                                <div className="flex gap-2 text-xs">
                                  {lecture.hasQuiz && (
                                    <span className={`px-2 py-1 rounded-full ${lecture.quizScore ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {lecture.quizScore ? `الكويز: ${lecture.quizScore}%` : 'كويز متاح'}
                                    </span>
                                  )}
                                  {lecture.hasAssignment && (
                                    <span className={`px-2 py-1 rounded-full ${lecture.assignmentStatus === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                      lecture.assignmentStatus === 'graded' ? 'bg-green-100 text-green-700' :
                                        'bg-yellow-100 text-yellow-700'
                                      }`}>
                                      {lecture.assignmentStatus === 'submitted' ? 'تم التسليم' :
                                        lecture.assignmentStatus === 'graded' ? 'تم التقييم' : 'مطلوب تكليف'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-4">
                              {lecture.hasQuiz && (
                                <Button variant="outline" size="sm" className="gap-2" disabled={!!lecture.quizScore}>
                                  <CheckCircle className="h-4 w-4" />
                                  {lecture.quizScore ? 'تم الاختبار' : 'بدء الكويز'}
                                </Button>
                              )}
                              {lecture.hasAssignment && (
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Upload className="h-4 w-4" />
                                  {lecture.assignmentStatus === 'pending' ? 'رفع التكليف' : 'إعادة الرفع'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                      <p>لا توجد محاضرات في هذا الترم حتى الآن</p>
                    </CardContent>
                  </Card>
                )}

                {/* Final Exam Card */}
                <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-bold mb-1">الامتحان الشامل</h4>
                      <p className="text-slate-300 text-sm">اختبار نهاية {activeTermData.name}</p>
                    </div>
                    <Button className="bg-white text-slate-900 hover:bg-slate-100" disabled={!activeTermData.finalExam.available}>
                      {activeTermData.finalExam.available ? 'بدء الامتحان' : 'قريباً'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Sidebar */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    سجل الحضور
                  </h3>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                      {activeTermData.attendance.length > 0 ? (
                        activeTermData.attendance.map((record, idx) => (
                          <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-10 rounded-full ${record.status === 'present' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <div>
                                <p className="font-medium text-slate-900">{record.date}</p>
                                <p className="text-xs text-slate-500">
                                  {record.status === 'present' ? 'حضور' : 'غياب'}
                                </p>
                              </div>
                            </div>
                            {record.status === 'present' ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500 text-sm">
                          لا يوجد سجل حضور
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
