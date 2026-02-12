// QR Attendance Page — Admin creates & manages attendance sessions

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  QrCode,
  ArrowRight,
  Users,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Wifi,
  RotateCw,
  ShieldCheck,
  StopCircle,
  Timer,
  RefreshCw
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
  pinCode: string;
  isActive: boolean;
}

// ─── Elapsed timer hook ───
function useElapsedTime(startTime: string | null) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();

    const tick = () => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = String(Math.floor(diff / 3600)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return elapsed;
}

export default function QRAttendancePage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [checkInUrl, setCheckInUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [pinCountdown, setPinCountdown] = useState(60);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [isEnding, setIsEnding] = useState(false);
  const channelRef = useRef<any>(null);
  const pinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PIN_ROTATE_SECONDS = 60;
  const POLL_INTERVAL_MS = 5000; // Poll attendees every 5s as fallback

  const elapsed = useElapsedTime(session?.createdAt ?? null);

  // ─── Generate a random 4-digit PIN ───
  const generatePin = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // ─── Update PIN in Supabase ───
  const updatePinInDb = useCallback(async (sessionId: string, newPin: string) => {
    try {
      await supabase
        .from('AttendanceSession')
        .update({ pinCode: newPin })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Error updating PIN:', err);
    }
  }, []);

  // ─── Rotate PIN ───
  const rotatePin = useCallback(async (sessionId: string) => {
    const newPin = generatePin();
    setCurrentPin(newPin);
    setPinCountdown(PIN_ROTATE_SECONDS);
    await updatePinInDb(sessionId, newPin);
  }, [updatePinInDb]);

  // ─── Start PIN auto-rotation ───
  const startPinRotation = useCallback((sessionId: string, initialPin: string) => {
    if (pinIntervalRef.current) clearInterval(pinIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setCurrentPin(initialPin);
    setPinCountdown(PIN_ROTATE_SECONDS);

    countdownRef.current = setInterval(() => {
      setPinCountdown(prev => (prev <= 1 ? PIN_ROTATE_SECONDS : prev - 1));
    }, 1000);

    pinIntervalRef.current = setInterval(() => {
      rotatePin(sessionId);
    }, PIN_ROTATE_SECONDS * 1000);
  }, [rotatePin]);

  // ─── Stop all timers ───
  const stopAllTimers = useCallback(() => {
    if (pinIntervalRef.current) { clearInterval(pinIntervalRef.current); pinIntervalRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
  }, []);

  // ─── Manual PIN regen ───
  const handleManualPinRegen = useCallback(async () => {
    if (!session) return;
    if (pinIntervalRef.current) clearInterval(pinIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    const newPin = generatePin();
    setCurrentPin(newPin);
    setPinCountdown(PIN_ROTATE_SECONDS);
    await updatePinInDb(session.id, newPin);

    countdownRef.current = setInterval(() => {
      setPinCountdown(prev => (prev <= 1 ? PIN_ROTATE_SECONDS : prev - 1));
    }, 1000);
    pinIntervalRef.current = setInterval(() => {
      rotatePin(session.id);
    }, PIN_ROTATE_SECONDS * 1000);
  }, [session, rotatePin, updatePinInDb]);

  // ─── Fetch attendees for a session ───
  const fetchAttendees = useCallback(async (sessionId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('Attendance')
        .select('userId, createdAt')
        .eq('sessionId', sessionId)
        .order('createdAt', { ascending: true });

      if (fetchError) throw fetchError;
      if (!data || data.length === 0) { setAttendees([]); return; }

      const userIds = data.map((d: any) => d.userId);
      const { data: users } = await supabase
        .from('User')
        .select('id, name, email')
        .in('id', userIds);

      const userMap: Record<string, any> = {};
      (users || []).forEach((u: any) => { userMap[u.id] = u; });

      setAttendees(data.map((d: any) => ({
        id: d.userId,
        name: userMap[d.userId]?.name || 'طالب',
        email: userMap[d.userId]?.email || '',
        checkedInAt: d.createdAt,
      })));
    } catch (err) {
      console.error('Error fetching attendees:', err);
    }
  }, []);

  // ─── Subscribe to realtime + start polling fallback ───
  const startAttendeeUpdates = useCallback((sessionId: string) => {
    // Initial fetch
    fetchAttendees(sessionId);

    // Realtime subscription
    try {
      const channel = supabase
        .channel(`attendance-${sessionId}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'Attendance', filter: `sessionId=eq.${sessionId}` },
          () => { fetchAttendees(sessionId); }
        )
        .subscribe();
      channelRef.current = channel;
    } catch (err) {
      console.error('Realtime subscription error:', err);
    }

    // Polling fallback every 5s
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchAttendees(sessionId);
    }, POLL_INTERVAL_MS);
  }, [fetchAttendees]);

  // ─── Generate QR code for a session ───
  const generateQrCode = useCallback(async (sessionId: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/attendance/checkin/${sessionId}`;
    setCheckInUrl(url);

    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
    setQrCodeDataUrl(qrDataUrl);
  }, []);

  // ─── Restore active session on mount ───
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsRestoring(false); return; }

        // Find the most recent active session (isActive = true)
        const { data: activeSessions, error: restoreErr } = await supabase
          .from('AttendanceSession')
          .select('id, title, createdAt, pinCode, isActive')
          .eq('isActive', true)
          .order('createdAt', { ascending: false })
          .limit(1);

        // If isActive column doesn't exist yet, skip restore gracefully
        if (restoreErr) {
          console.warn('Could not query active sessions (isActive column may not exist yet):', restoreErr.message);
          setIsRestoring(false);
          return;
        }

        if (activeSessions && activeSessions.length > 0) {
          const s = activeSessions[0];
          setSession({ id: s.id, title: s.title || '', createdAt: s.createdAt, pinCode: s.pinCode || '', isActive: true });

          await generateQrCode(s.id);
          startPinRotation(s.id, s.pinCode || generatePin());
          startAttendeeUpdates(s.id);
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();

    return () => { stopAllTimers(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Create new session ───
  const createSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('يجب تسجيل الدخول أولاً'); setIsLoading(false); return; }

      stopAllTimers();

      // End any previously active sessions
      await supabase
        .from('AttendanceSession')
        .update({ isActive: false, endedAt: new Date().toISOString() })
        .eq('isActive', true);

      const sessionId = crypto.randomUUID();
      const now = new Date();
      const title = `جلسة حضور ${now.toLocaleDateString('ar-SA')}`;
      const pinCode = generatePin();

      const { error: insertError } = await supabase
        .from('AttendanceSession')
        .insert({
          id: sessionId,
          title,
          date: now.toISOString(),
          platform: 'BEDAYA',
          pinCode,
          isActive: true,
          createdAt: now.toISOString(),
        });

      if (insertError) {
        console.error('Error creating session:', insertError);
        throw new Error('فشل في إنشاء جلسة الحضور');
      }

      setSession({ id: sessionId, title, createdAt: now.toISOString(), pinCode, isActive: true });
      setAttendees([]);

      await generateQrCode(sessionId);
      startPinRotation(sessionId, pinCode);
      startAttendeeUpdates(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── End session ───
  const endSession = async () => {
    if (!session) return;
    setIsEnding(true);

    try {
      await supabase
        .from('AttendanceSession')
        .update({ isActive: false, endedAt: new Date().toISOString(), pinCode: null })
        .eq('id', session.id);

      stopAllTimers();
      setSession(null);
      setQrCodeDataUrl(null);
      setCheckInUrl(null);
      setCurrentPin('');
      setAttendees([]);
    } catch (err) {
      console.error('Error ending session:', err);
    } finally {
      setIsEnding(false);
    }
  };

  // ─── Helpers ───
  const copyLink = async () => {
    if (!checkInUrl) return;
    try {
      await navigator.clipboard.writeText(checkInUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  // ─── Loading state while restoring ───
  if (isRestoring) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">جاري التحقق من الجلسات النشطة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
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

            {/* Session timer in header */}
            {session && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl">
                  <Timer className="w-4 h-4" />
                  <span className="font-mono font-bold text-sm tabular-nums">{elapsed}</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl">
                  <Users className="w-4 h-4" />
                  <span className="font-bold text-sm">{attendees.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {!session ? (
          // ─── No active session ───
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
          // ─── Active session ───
          <div className="space-y-6">
            {/* Live indicator + session info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">{session.title}</p>
                  <p className="text-xs text-slate-500">بدأت: {formatTime(session.createdAt)} — المدة: {elapsed}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fetchAttendees(session.id)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
                >
                  <RefreshCw className="w-3 h-3 ml-1" />
                  تحديث
                </Button>
                <Button
                  onClick={endSession}
                  disabled={isEnding}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {isEnding ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <StopCircle className="w-3 h-3 ml-1" />}
                  إنهاء الجلسة
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code Section */}
              <Card className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
                <CardContent className="p-6 md:p-8 text-center">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    امسح الكود لتسجيل الحضور
                  </h3>

                  {qrCodeDataUrl && (
                    <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mb-5">
                      <img src={qrCodeDataUrl} alt="QR Code للحضور" className="w-56 h-56 md:w-64 md:h-64" />
                    </div>
                  )}

                  {/* PIN Code Display — Auto-rotating */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-2xl p-4 mb-4 relative overflow-hidden">
                    <p className="text-xs font-medium text-amber-700 mb-2 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      كود الحضور الرقمي
                    </p>
                    <div className="text-4xl font-black text-amber-800 tracking-[0.3em] font-mono">
                      {currentPin}
                    </div>

                    {/* Countdown ring */}
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <div className="relative w-8 h-8">
                        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="#fde68a" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="15" fill="none"
                            stroke="#f59e0b" strokeWidth="3"
                            strokeDasharray={`${(pinCountdown / PIN_ROTATE_SECONDS) * 94.2} 94.2`}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-linear"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-amber-700">
                          {pinCountdown}
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-600 font-medium">يتغير تلقائياً</span>
                    </div>

                    {/* Manual regenerate + copy */}
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <button
                        onClick={handleManualPinRegen}
                        className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        <RotateCw className="w-3 h-3" />
                        تغيير يدوي
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentPin);
                          setCopiedPin(true);
                          setTimeout(() => setCopiedPin(false), 2000);
                        }}
                        className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedPin ? 'تم ✓' : 'نسخ'}
                      </button>
                    </div>

                    <p className="text-[10px] text-amber-600 mt-2">الكود يتجدد كل {PIN_ROTATE_SECONDS} ثانية</p>
                  </div>

                  {/* Copy link & share */}
                  <div className="flex items-center gap-2 justify-center">
                    <Button onClick={copyLink} variant="outline" size="sm" className="rounded-xl text-xs">
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
                </CardContent>
              </Card>

              {/* Attendees Section */}
              <Card className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">الحاضرون</h3>
                    <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      <Users className="w-4 h-4" />
                      <span>{attendees.length}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
                    <Wifi className="w-3 h-3 animate-pulse text-emerald-500" />
                    <span>يتم التحديث تلقائياً كل {POLL_INTERVAL_MS / 1000} ثوانٍ</span>
                  </div>

                  {attendees.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>لم يسجل أي طالب حضوره بعد</p>
                      <p className="text-xs mt-1">سيظهر الطلاب هنا فوراً عند مسح الكود</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {attendees.map((attendee, idx) => (
                        <div
                          key={attendee.id}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-black">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 text-sm truncate">
                              {attendee.name}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">
                              {attendee.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{formatTime(attendee.checkedInAt)}</span>
                          </div>
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
