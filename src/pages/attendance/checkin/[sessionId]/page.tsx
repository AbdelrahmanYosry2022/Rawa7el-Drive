// 'use client' removed for Vite;

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Loader2,
  User,
  Mail,
  AlertCircle
} from 'lucide-react';

type CheckInStatus = 'loading' | 'registration' | 'checking' | 'success' | 'already' | 'error' | 'invalid';

export default function CheckInPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [status, setStatus] = useState<CheckInStatus>('loading');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      checkSessionAndAutoCheckIn();
    } else {
      setStatus('invalid');
    }
  }, [sessionId]);

  const checkSessionAndAutoCheckIn = async () => {
    try {
      // 1. Verify session exists
      const { data: sessionData, error: sessError } = await supabase
        .from('AttendanceSession')
        .select('id, title')
        .eq('id', sessionId!)
        .single();

      if (sessError || !sessionData) {
        setError('جلسة الحضور غير موجودة أو منتهية');
        setStatus('invalid');
        return;
      }

      // 2. Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Logged-in user — auto check-in
        await performCheckIn(user.id);
      } else {
        // Not logged in — show registration form
        setStatus('registration');
      }
    } catch (err) {
      console.error('Error during check-in:', err);
      setError('حدث خطأ في الاتصال');
      setStatus('error');
    }
  };

  const performCheckIn = async (userId: string) => {
    try {
      // Check if already checked in
      const { data: existing } = await supabase
        .from('Attendance')
        .select('id')
        .eq('sessionId', sessionId!)
        .eq('userId', userId)
        .maybeSingle();

      if (existing) {
        // Get user name for display
        const { data: userData } = await supabase
          .from('User')
          .select('name')
          .eq('id', userId)
          .single();
        setUserName(userData?.name || null);
        setStatus('already');
        return;
      }

      // Insert attendance record
      const now = new Date().toISOString();
      const { error: insertError } = await supabase
        .from('Attendance')
        .insert({
          id: crypto.randomUUID(),
          sessionId: sessionId!,
          userId,
          status: 'PRESENT',
          createdAt: now,
          updatedAt: now,
        });

      if (insertError) {
        console.error('Error inserting attendance:', insertError);
        throw new Error('فشل في تسجيل الحضور');
      }

      // Get user name for display
      const { data: userData } = await supabase
        .from('User')
        .select('name')
        .eq('id', userId)
        .single();
      setUserName(userData?.name || null);
      setStatus('success');
    } catch (err) {
      console.error('Error performing check-in:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ');
      setStatus('error');
    }
  };

  const handleGuestRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      setError('يرجى إدخال الاسم والبريد الإلكتروني');
      return;
    }

    setStatus('checking');
    setError(null);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      // Check if user exists by email
      const { data: existingUser } = await supabase
        .from('User')
        .select('id, name')
        .eq('email', trimmedEmail)
        .maybeSingle();

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        // Update name if different
        if (trimmedName !== existingUser.name) {
          await supabase
            .from('User')
            .update({ name: trimmedName, updatedAt: new Date().toISOString() })
            .eq('id', userId);
        }
      } else {
        // Create new user
        userId = crypto.randomUUID();
        const now = new Date().toISOString();
        const { error: createError } = await supabase
          .from('User')
          .insert({
            id: userId,
            name: trimmedName,
            email: trimmedEmail,
            role: 'STUDENT',
            platform: 'BEDAYA',
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });

        if (createError) {
          console.error('Error creating user:', createError);
          throw new Error('فشل في إنشاء الحساب');
        }
      }

      // Now perform check-in
      await performCheckIn(userId);
    } catch (err) {
      console.error('Error in guest registration:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ');
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

              <form onSubmit={handleGuestRegister} className="space-y-4">
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
                      className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-left"
                      dir="ltr"
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
              {userName && <p className="text-emerald-600 font-medium mb-1">مرحباً {userName}</p>}
              <p className="text-slate-500">شكراً لك، تم تسجيل حضورك بنجاح</p>
            </div>
          )}

          {status === 'already' && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">تم تسجيلك مسبقاً</h1>
              {userName && <p className="text-blue-600 font-medium mb-1">مرحباً {userName}</p>}
              <p className="text-slate-500">لقد سجلت حضورك في هذه الجلسة من قبل</p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <AlertCircle className="w-14 h-14 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">جلسة غير صالحة</h1>
              <p className="text-slate-500 mb-4">{error || 'رابط الحضور غير صالح أو منتهي'}</p>
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
