'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import { 
  QrCode, 
  ArrowRight,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface AttendanceSession {
  id: string;
  createdAt: string;
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    checkedInAt: string;
  }>;
}

export default function QRAttendancePage() {
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/attendance/session', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('فشل في إنشاء جلسة الحضور');
      }
      
      const data = await response.json();
      setSession(data.session);
      setQrCodeUrl(data.qrCodeUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for attendees updates
  useEffect(() => {
    if (!session?.id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/attendance/session/${session.id}`);
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [session?.id]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/attendance" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">تسجيل الحضور بـ QR</h1>
                <p className="text-xs text-slate-500">اعرض الكود للطلاب لتسجيل حضورهم</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {!session ? (
          // No active session - show create button
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">ابدأ جلسة حضور جديدة</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              أنشئ جلسة حضور جديدة وسيتم توليد QR Code يمكن للطلاب مسحه لتسجيل حضورهم
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 max-w-md mx-auto">
                {error}
              </div>
            )}
            
            <Button
              onClick={createSession}
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl px-8 py-6 text-lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 ml-2" />
                  إنشاء جلسة حضور
                </>
              )}
            </Button>
          </div>
        ) : (
          // Active session - show QR code and attendees
          <div className="grid md:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <Card className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  امسح الكود لتسجيل الحضور
                </h3>
                
                {qrCodeUrl && (
                  <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mb-6">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code للحضور" 
                      className="w-64 h-64"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>بدأت الجلسة: {formatTime(session.createdAt)}</span>
                </div>
                
                <Button
                  onClick={createSession}
                  variant="outline"
                  className="mt-4 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إنشاء جلسة جديدة
                </Button>
              </CardContent>
            </Card>

            {/* Attendees Section */}
            <Card className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    الحاضرون
                  </h3>
                  <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    <Users className="w-4 h-4" />
                    <span>{session.attendees.length}</span>
                  </div>
                </div>
                
                {session.attendees.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>لم يسجل أي طالب حضوره بعد</p>
                    <p className="text-xs mt-1">سيظهر الطلاب هنا عند مسح الكود</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {session.attendees.map((attendee, index) => (
                      <div 
                        key={attendee.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 text-sm truncate">
                            {attendee.name}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {attendee.email}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatTime(attendee.checkedInAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
