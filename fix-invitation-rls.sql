-- خطوة 1: شوف المستخدم الحالي في auth.users
SELECT id, email, created_at FROM auth.users;

-- خطوة 2: شوف لو المستخدم موجود في جدول User
SELECT id, email, name, role FROM "User";

-- خطوة 3: لو المستخدم مش موجود في جدول User، أضفه
-- استبدل 'YOUR_AUTH_USER_ID' بالـ ID من الخطوة 1
-- واستبدل 'your@email.com' بالإيميل الصحيح

/*
INSERT INTO "User" (id, email, name, role, platform, "isActive", "createdAt", "updatedAt")
VALUES (
  'YOUR_AUTH_USER_ID',  -- من auth.users
  'your@email.com',
  'اسم المشرف',
  'ADMIN',
  'BEDAYA',
  true,
  NOW(),
  NOW()
);
*/

-- خطوة 4: لو المستخدم موجود بس مش ADMIN، حدّث الـ role
-- استبدل 'YOUR_AUTH_USER_ID' بالـ ID الصحيح

/*
UPDATE "User" 
SET role = 'ADMIN', "updatedAt" = NOW()
WHERE id = 'YOUR_AUTH_USER_ID';
*/

-- خطوة 5: تأكد إن الـ RLS policy موجودة وصحيحة
-- شغّل ده لو الـ policy مش موجودة
DROP POLICY IF EXISTS "Admins can manage invitation links" ON invitation_links;

CREATE POLICY "Admins can manage invitation links" ON invitation_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')
    )
  );
