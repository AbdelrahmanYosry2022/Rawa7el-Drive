import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  FileQuestion,
  Search,
  Loader2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  passingScore: number;
  platform: string;
  isPublished: boolean;
  createdAt: string;
}

interface Submission {
  id: string;
  examId: string;
  score: number | null;
  percentage: number | null;
  passed: boolean;
  status: 'ONGOING' | 'SUBMITTED' | 'EXPIRED';
  submittedAt: string | null;
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExamsAndSubmissions();
  }, []);

  const fetchExamsAndSubmissions = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all published exams
      const { data: examsData, error: examsError } = await supabase
        .from('Exam')
        .select('*')
        .eq('isPublished', true)
        .order('createdAt', { ascending: false });

      if (examsError) throw examsError;
      setExams(examsData || []);

      // Fetch student submissions
      const { data: subsData, error: subsError } = await supabase
        .from('Submission')
        .select('*')
        .eq('userId', user.id);

      if (subsError) throw subsError;
      
      const subsMap: Record<string, Submission> = {};
      subsData?.forEach(sub => {
        subsMap[sub.examId] = sub;
      });
      setSubmissions(subsMap);

    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">الاختبارات</h1>
          <p className="text-slate-500 font-medium text-lg">قيّم مستواك وتابع تقدمك من خلال الاختبارات المتاحة</p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث عن اختبار..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none text-slate-600 font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
          <div className="w-24 h-24 mx-auto mb-6 bg-slate-50 rounded-full flex items-center justify-center">
            <FileQuestion className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">لا توجد اختبارات حالياً</h3>
          <p className="text-slate-500 font-medium">سيتم إدراج الاختبارات هنا بمجرد نشرها من قبل المشرف.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => {
            const submission = submissions[exam.id];
            const isCompleted = submission?.status === 'SUBMITTED';
            
            return (
              <Card key={exam.id} className="group bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-100 transition-all duration-500">
                <CardContent className="p-0">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500 shadow-sm shadow-emerald-100">
                        <GraduationCap className="w-8 h-8" />
                      </div>
                      {isCompleted ? (
                        <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 border ${submission.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {submission.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span className="text-[10px] font-black uppercase tracking-wider">{submission.passed ? 'ناجح' : 'لم ينجح'}</span>
                        </div>
                      ) : (
                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1.5 border border-blue-100">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">متاح</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1">{exam.title}</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 line-clamp-2 leading-relaxed">
                      {exam.description || 'لا يوجد وصف متاح لهذا الاختبار.'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 mb-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المدة</span>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold">{exam.durationMinutes} دقيقة</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">درجة النجاح</span>
                        <div className="flex items-center gap-1.5 text-slate-700 justify-end">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="font-bold">{exam.passingScore}%</span>
                        </div>
                      </div>
                    </div>

                    {isCompleted ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">درجتك</p>
                          <p className={`text-2xl font-black ${submission.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                            {submission.percentage}%
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-slate-50 flex items-center justify-center font-black text-slate-300 text-xs">
                          {submission.score}
                        </div>
                      </div>
                    ) : (
                      <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 group-hover:scale-[1.02] active:scale-[0.98]">
                        <PlayCircle className="w-5 h-5" />
                        <span>ابدأ الاختبار الآن</span>
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:translate-x-[-4px] transition-transform" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
