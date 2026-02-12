// 'use client' removed for Vite;

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  QrCode,
  ArrowRight,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Wifi
} from 'lucide-react';

interface Attendee {
  id: string;
  name: string;
  email: string;
  checkedInAt: string;
}

interface SessionData {
  id: string;
  title: string;
  createdAt: string;
}

export default function QRAttendancePage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [checkInUrl, setCheckInUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const channelRef = useRef<any>(null);

  // Cleanup realtime subscription on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const createSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('يجب تسجيل الدخول أولاً');
        setIsLoading(false);
        return;
      }

      // Cleanup previous realtime subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create a new attendance session in Supabase
      const sessionId = crypto.randomUUID();
      const now = new Date();
      const title = `جلسة حضور ${now.toLocaleDateString('ar-SA')}`;

      const { error: insertError } = await supabase
        .from('AttendanceSession')
        .insert({
          id: sessionId,
          title,
          date: now.toISOString(),
          platform: 'BEDAYA',
          createdAt: now.toISOString(),
        });

      if (insertError) {
        console.error('Error creating session:', insertError);
        throw new Error('فشل في إنشاء جلسة الحضور');
      }

      // Generate check-in URL
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/attendance/checkin/${sessionId}`;
      setCheckInUrl(url);

      // Generate QR code client-side
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      });

      setSession({ id: sessionId, title, createdAt: now.toISOString() });
      setAttendees([]);
      setQrCodeDataUrl(qrDataUrl);

      // Subscribe to realtime attendance updates for this session
      subscribeToAttendance(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToAttendance = (sessionId: string) => {
    // Also do an initial fetch
    fetchAttendees(sessionId);

    const channel = supabase
      .channel(`attendance-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Attendance',
          filter: `sessionId=eq.${sessionId}`,
        },
        (payload: any) => {
          // When a new attendance record is inserted, fetch the user details
          if (payload.new) {
            fetchAttendeeDetails(payload.new.userId, payload.new.createdAt);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const fetchAttendees = async (sessionId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('Attendance')
        .select('userId, createdAt')
        .eq('sessionId', sessionId)
        .order('createdAt', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        // Fetch user details for each attendee
        const userIds = data.map((d: any) => d.userId);
        const { data: users } = await supabase
          .from('User')
          .select('id, name, email')
          .in('id', userIds);

        const userMap: Record<string, any> = {};
        (users || []).forEach((u: any) => { userMap[u.id] = u; });

        const attendeeList: Attendee[] = data.map((d: any) => ({
          id: d.userId,
          name: userMap[d.userId]?.name || 'طالب',
          email: userMap[d.userId]?.email || '',
          checkedInAt: d.createdAt,
        }));

        setAttendees(attendeeList);
      }
    } catch (err) {
      console.error('Error fetching attendees:', err);
    }
  };

  const fetchAttendeeDetails = async (userId: string, checkedInAt: string) => {
    try {
      const { data: userData } = await supabase
        .from('User')
        .select('id, name, email')
        .eq('id', userId)
        .single();

      if (userData) {
        setAttendees(prev => {
          // Avoid duplicates
          if (prev.some(a => a.id === userData.id)) return prev;
          return [...prev, {
            id: userData.id,
            name: userData.name || 'طالب',
            email: userData.email || '',
            checkedInAt,
          }];
        });
      }
    } catch (err) {
      console.error('Error fetching attendee details:', err);
    }
  };

  const copyLink = async () => {
    if (!checkInUrl) return;
    try {
      await navigator.clipboard.writeText(checkInUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = checkInUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
            <Link to="/attendance" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
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
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
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
          <div className="space-y-6">
            {/* Live indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 font-medium">
              <Wifi className="w-4 h-4 animate-pulse" />
              <span>الجلسة نشطة — يتم التحديث تلقائياً</span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* QR Code Section */}
              <Card className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    امسح الكود لتسجيل الحضور
                  </h3>

                  {qrCodeDataUrl && (
                    <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mb-6">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code للحضور"
                        className="w-64 h-64"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>بدأت الجلسة: {formatTime(session.createdAt)}</span>
                  </div>

                  {/* Copy link & share */}
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <Button
                      onClick={copyLink}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                    >
                      <Copy className="w-3 h-3 ml-1" />
                      {copied ? 'تم النسخ ✓' : 'نسخ الرابط'}
                    </Button>
                    {checkInUrl && (
                      <a href={checkInUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="rounded-xl text-xs">
                          <ExternalLink className="w-3 h-3 ml-1" />
                          فتح الرابط
                        </Button>
                      </a>
                    )}
                  </div>

                  <Button
                    onClick={createSession}
                    variant="outline"
                    className="rounded-xl"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
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
                      <span>{attendees.length}</span>
                    </div>
                  </div>

                  {attendees.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>لم يسجل أي طالب حضوره بعد</p>
                      <p className="text-xs mt-1">سيظهر الطلاب هنا فوراً عند مسح الكود</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {attendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl animate-in fade-in duration-300"
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
          </div>
        )}
      </div>
    </div>
  );
}
