import { getUsers, updateUserRole } from '@/app/actions/teacher/users';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DeleteUserButton } from '@/components/teacher/delete-user-button';
import { Users } from 'lucide-react';

// Type definition for user
interface AppUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  createdAt: Date;
}

async function handleUpdateRole(formData: FormData) {
  'use server';

  const userId = String(formData.get('userId') || '');
  const role = String(formData.get('role') || '');

  if (!userId) return;
  if (role !== 'ADMIN' && role !== 'STUDENT') return;

  await updateUserRole(userId, role as 'ADMIN' | 'STUDENT');
}

export default async function TeacherUsersPage() {
  const { currentUserId, users } = await getUsers();

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1 text-right flex flex-row gap-4 items-center flex-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-start justify-start gap-2">
            <h2 className="text-xl font-semibold text-slate-900">إدارة المستخدمين</h2>
            <p className="text-xs text-slate-500">
              عرض جميع المستخدمين وتحديث الأدوار وحذف الحسابات عند الحاجة.
            </p>
          </div>
        </div>
      </div>

      {users.length === 0 ? (
        <Card className="bg-white border border-slate-100 shadow-sm">
          <CardContent className="py-10 text-center text-slate-500 text-sm">
            لا يوجد مستخدمون مسجلون حتى الآن.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-slate-100 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: AppUser) => {
                  const isAdmin = user.role === 'ADMIN';
                  const isSelf = user.id === currentUserId;
                  const joinedAt = new Date(user.createdAt).toLocaleDateString('ar-EG');
                  const initial = user.email.charAt(0).toUpperCase();

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-600">
                            {initial}
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-slate-800">{user.email}</p>
                            {isSelf && (
                              <p className="text-[10px] text-emerald-600">هذا أنت</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            isAdmin
                              ? 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200'
                          }
                        >
                          {isAdmin ? 'مشرف' : 'طالب'}
                        </span>
                      </TableCell>
                      <TableCell>{joinedAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {!isSelf && (
                            <form action={handleUpdateRole}>
                              <input type="hidden" name="userId" value={user.id} />
                              <input
                                type="hidden"
                                name="role"
                                value={isAdmin ? 'STUDENT' : 'ADMIN'}
                              />
                              <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                              >
                                {isAdmin ? 'إزالة المشرف' : 'جعله مشرفًا'}
                              </Button>
                            </form>
                          )}
                          <DeleteUserButton userId={user.id} disabled={isSelf} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
