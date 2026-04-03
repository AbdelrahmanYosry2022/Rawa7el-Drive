import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/lib/supabase';
import {
  determineAttendanceStatus,
  validateSessionForCheckIn,
  getSessionStartTime,
} from '@rawa7el/attendance-logic/utils';
import {
  Camera,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ScanLine,
  Keyboard,
  X,
  Clock
} from 'lucide-react';

type ScanStatus = 'idle' | 'scanning' | 'processing' | 'success' | 'already' | 'error' | 'invalid' | 'late';
type InputMode = 'scan' | 'pin';

export default function StudentScanPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<InputMode>('scan');
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [attendanceResult, setAttendanceResult] = useState<'PRESENT' | 'LATE' | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (mode === 'scan' && status === 'idle') {
      startScanner();
    } else {
      stopScanner();
    }
  }, [mode, status]);

  const startScanner = async () => {
    setCameraError(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleQrResult(decodedText);
        },
        () => {
          // Ignore scan failures (no QR found in frame)
        }
      );
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        err?.message?.includes('NotAllowed') || err?.toString()?.includes('NotAllowed')
          ? 'يرجى السماح بالوصول للكاميرا من إعدادات المتصفح'
          : 'لم نتمكن من فتح الكاميرا. جرب إدخال الكود الرقمي بدلاً من ذلك.'
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
  };

  const handleQrResult = async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    await stopScanner();
    setStatus('processing');

    try {
      // Extract sessionId from URL
      const match = decodedText.match(/\/attendance\/checkin\/([a-f0-9-]+)/i);
      if (!match) {
        setError('كود QR غير صالح');
        setStatus('invalid');
        isProcessingRef.current = false;
        return;
      }

      const sessionId = match[1];
      await performCheckIn(sessionId);
    } catch (err) {
      console.error('QR processing error:', err);
      setError('حدث خطأ أثناء معالجة الكود');
      setStatus('error');
    }
    isProcessingRef.current = false;
  };

  const performCheckIn = async (sessionId: string) => {
    try {
      // Verify session exists and get full details for validation
      const { data: sessionData, error: sessError } = await supabase
        .from('AttendanceSession')
        .select('id, date, startTime, endTime, endedAt, isActive, lateThresholdMinutes, maxDurationMinutes, createdAt')
        .eq('id', sessionId)
        .single();

      if (sessError || !sessionData) {
        setError('جلسة الحضور غير موجودة أو منتهية');
        setStatus('invalid');
        return;
      }

      // Validate session is accepting check-ins
      const validation = validateSessionForCheckIn({
        id: sessionData.id,
        isActive: sessionData.isActive,
        date: sessionData.date,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        endedAt: sessionData.endedAt,
        maxDurationMinutes: sessionData.maxDurationMinutes,
        createdAt: sessionData.createdAt,
      });

      if (!validation.valid) {
        setError(validation.message || 'جلسة الحضور غير متاحة');
        setStatus('invalid');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('يجب تسجيل الدخول أولاً');
        setStatus('error');
        return;
      }

      // Check if already checked in
      const { data: existing } = await supabase
        .from('Attendance')
        .select('id, status')
        .eq('sessionId', sessionId)
        .eq('userId', user.id)
        .maybeSingle();

      if (existing) {
        const { data: userData } = await supabase
          .from('User')
          .select('name')
          .eq('id', user.id)
          .single();
        setUserName(userData?.name || null);
        setAttendanceResult(existing.status as 'PRESENT' | 'LATE');
        setStatus('already');
        return;
      }

      // Determine attendance status (PRESENT vs LATE)
      const now = new Date();
      const sessionStartTime = getSessionStartTime(sessionData);
      const attStatus = determineAttendanceStatus({
        sessionStartTime,
        checkInTime: now,
        lateThresholdMinutes: sessionData.lateThresholdMinutes ?? 15,
      }) as 'PRESENT' | 'LATE';

      // Insert attendance
      const nowIso = now.toISOString();
      const { error: insertError } = await supabase
        .from('Attendance')
        .insert({
          id: crypto.randomUUID(),
          sessionId,
          userId: user.id,
          status: attStatus,
          checkInTime: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('فشل في تسجيل الحضور');
      }

      const { data: userData } = await supabase
        .from('User')
        .select('name')
        .eq('id', user.id)
        .single();
      setUserName(userData?.name || null);
      setAttendanceResult(attStatus);
      setStatus(attStatus === 'LATE' ? 'late' : 'success');
    } catch (err) {
      console.error('Check-in error:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ');
      setStatus('error');
    }
  };

  const handlePinInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newDigits = [...pinDigits];
    newDigits[index] = value.slice(-1); // Only last char
    setPinDigits(newDigits);
    setError(null);

    // Auto-focus next input
    if (value && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify immediately when all 4 digits entered
    if (value && newDigits.every(d => d !== '')) {
      // Use the digits directly (don't rely on state which hasn't updated yet)
      const pin = newDigits.join('');
      autoVerifyPin(pin);
    }
  };

  const autoVerifyPin = async (pin: string) => {
    setStatus('processing');
    setError(null);

    try {
      // Only look up active sessions with this PIN
      const { data: sessionData, error: sessError } = await supabase
        .from('AttendanceSession')
        .select('id')
        .eq('pinCode', pin)
        .eq('isActive', true)
        .order('createdAt', { ascending: false })
        .limit(1);

      if (sessError || !sessionData || sessionData.length === 0) {
        setError('الكود غير صحيح أو منتهي الصلاحية');
        setStatus('idle');
        setPinDigits(['', '', '', '']);
        setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
        return;
      }

      await performCheckIn(sessionData[0].id);
    } catch (err) {
      console.error('PIN auto-verify error:', err);
      setError('حدث خطأ أثناء التحقق');
      setStatus('idle');
      setPinDigits(['', '', '', '']);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const pin = pinDigits.join('');
      if (pin.length === 4) {
        autoVerifyPin(pin);
      }
    }
  };

  const resetState = () => {
    setStatus('idle');
    setError(null);
    setPinDigits(['', '', '', '']);
    setAttendanceResult(null);
    isProcessingRef.current = false;
  };

  // Result screens
  if (status === 'success' || status === 'late' || status === 'already' || status === 'invalid' || status === 'error') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          {status === 'success' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-14 h-14 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">تم تسجيل حضورك!</h1>
              {userName && <p className="text-emerald-600 font-medium mb-1">مرحباً {userName}</p>}
              <p className="text-slate-500 text-sm">شكراً لك، تم تسجيل حضورك بنجاح</p>
            </>
          )}

          {status === 'late' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Clock className="w-14 h-14 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">تم تسجيل حضورك</h1>
              {userName && <p className="text-amber-600 font-medium mb-1">مرحباً {userName}</p>}
              <p className="text-amber-600 font-medium text-sm">تم تسجيلك متأخراً</p>
              <p className="text-slate-400 text-xs mt-1">يرجى الحرص على الحضور في الموعد المحدد</p>
            </>
          )}

          {status === 'already' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">تم تسجيلك مسبقاً</h1>
              {userName && <p className="text-blue-600 font-medium mb-1">مرحباً {userName}</p>}
              <p className="text-slate-500 text-sm">لقد سجلت حضورك في هذه الجلسة من قبل</p>
              {attendanceResult === 'LATE' && (
                <p className="text-amber-600 text-xs mt-1">الحالة: متأخر</p>
              )}
            </>
          )}

          {status === 'invalid' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <AlertCircle className="w-14 h-14 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">كود غير صالح</h1>
              <p className="text-slate-500 text-sm mb-4">{error || 'الكود غير صالح أو الجلسة منتهية'}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
                <AlertCircle className="w-14 h-14 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">حدث خطأ</h1>
              <p className="text-slate-500 text-sm mb-4">{error || 'لم نتمكن من تسجيل حضورك'}</p>
            </>
          )}

          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={resetState}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm"
            >
              مسح مرة أخرى
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors text-sm"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto text-emerald-500 animate-spin mb-4" />
          <p className="text-slate-600 font-medium">جاري تسجيل الحضور...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/student/dashboard')}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">تسجيل الحضور</h1>
          <p className="text-xs text-slate-500">امسح الكود أو أدخل الرقم</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
        <button
          onClick={() => { setMode('scan'); setError(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
            mode === 'scan'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          مسح QR
        </button>
        <button
          onClick={() => { setMode('pin'); setError(null); stopScanner(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
            mode === 'pin'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          كود رقمي
        </button>
      </div>

      {/* QR Scanner Mode */}
      {mode === 'scan' && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-3xl overflow-hidden" style={{ minHeight: '320px' }}>
            <div id="qr-reader" className="w-full" />

            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 p-6">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-white text-sm mb-4">{cameraError}</p>
                  <button
                    onClick={() => setMode('pin')}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    <Keyboard className="w-4 h-4 inline ml-1" />
                    استخدم الكود الرقمي
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-slate-500">
            وجّه الكاميرا نحو كود الـ QR المعروض
          </p>
        </div>
      )}

      {/* PIN Input Mode */}
      {mode === 'pin' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Hash className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">أدخل كود الحضور</h2>
            <p className="text-sm text-slate-500">اطلب الكود من المعلم وأدخله هنا</p>
          </div>

          {/* PIN Input Fields */}
          <div className="flex justify-center gap-3" dir="ltr">
            {pinDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { pinInputRefs.current[index] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinInput(index, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(index, e)}
                className={`w-16 h-20 text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none ${
                  digit
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-emerald-400 focus:bg-white'
                }`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 justify-center">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <p className="text-center text-xs text-slate-400">
            أدخل الأرقام الأربعة وسيتم التحقق تلقائياً
          </p>

          {/* Clear button */}
          {pinDigits.some(d => d !== '') && (
            <button
              onClick={() => {
                setPinDigits(['', '', '', '']);
                setError(null);
                pinInputRefs.current[0]?.focus();
              }}
              className="w-full py-2 text-slate-500 text-sm hover:text-slate-700 flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" />
              مسح الكود
            </button>
          )}
        </div>
      )}
    </div>
  );
}
