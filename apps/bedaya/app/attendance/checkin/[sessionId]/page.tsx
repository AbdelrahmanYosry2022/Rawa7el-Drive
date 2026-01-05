'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent } from '@rawa7el/ui/card';
import { Button } from '@rawa7el/ui/button';
import { 
  CheckCircle2, 
  Loader2,
  User,
  Mail,
  AlertCircle
} from 'lucide-react';

// Generate a unique visitor ID based on browser fingerprint
function generateVisitorId(): string {
  // Try to get from localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('visitor_id');
    if (stored) return stored;
    
    // Generate new ID based on various browser properties
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const visitorId = Math.abs(hash).toString(36) + Date.now().toString(36);
    localStorage.setItem('visitor_id', visitorId);
    return visitorId;
  }
  
  return crypto.randomUUID();
}

type CheckInStatus = 'loading' | 'registration' | 'checking' | 'success' | 'already' | 'error';

export default function CheckInPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [status, setStatus] = useState<CheckInStatus>('loading');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    const id = generateVisitorId();
    setVisitorId(id);
    
    // Try to auto check-in (for returning visitors)
    tryAutoCheckIn(id);
  }, [sessionId]);

  const tryAutoCheckIn = async (vid: string) => {
    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          visitorId: vid,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyCheckedIn) {
          setStatus('already');
        } else {
          setStatus('success');
        }
      } else if (data.requiresRegistration) {
        // First time - need to register
        setStatus('registration');
      } else {
        setError(data.error || 'حدث خطأ');
        setStatus('error');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
      setStatus('error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      setError('يرجى إدخال الاسم والبريد الإلكتروني');
      return;
    }

    setStatus('checking');
    setError(null);

    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          visitorId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
      } else {
        setError(data.error || 'حدث خطأ');
        setStatus('registration');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
      setStatus('registration');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
        <CardContent className="p-8">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 mx-auto text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-600">جاري التحقق...</p>
            </div>
          )}

          {status === 'checking' && (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 mx-auto text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-600">جاري تسجيل الحضور...</p>
            </div>
          )}

          {status === 'registration' && (
            <div>
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">مرحباً بك!</h1>
                <p className="text-slate-500">أدخل بياناتك لتسجيل الحضور</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="أدخل اسمك الكامل"
                      required
                      className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      required
                      className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-left dir-ltr"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl py-6 text-lg"
                >
                  تسجيل الحضور
                </Button>
              </form>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">تم تسجيل حضورك!</h1>
              <p className="text-slate-500">شكراً لك، تم تسجيل حضورك بنجاح</p>
            </div>
          )}

          {status === 'already' && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">تم تسجيلك مسبقاً</h1>
              <p className="text-slate-500">لقد سجلت حضورك في هذه الجلسة من قبل</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
                <AlertCircle className="w-14 h-14 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">حدث خطأ</h1>
              <p className="text-slate-500 mb-4">{error || 'لم نتمكن من تسجيل حضورك'}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="rounded-xl"
              >
                حاول مرة أخرى
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
