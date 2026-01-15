-- Trigger to sync auth.users with public."User" table
-- This ensures that when a user registers via Supabase Auth, they are also added to the User table

-- Function that runs when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (
    id,
    email,
    name,
    phone,
    avatar,
    role,
    platform,
    "isActive",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::public."Role", 'STUDENT'::"Role"),
    'BEDAYA'::"Platform",
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public."User".name),
    phone = COALESCE(EXCLUDED.phone, public."User".phone),
    avatar = COALESCE(EXCLUDED.avatar, public."User".avatar),
    "updatedAt" = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after insert on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also sync existing auth.users that don't have a corresponding User record
INSERT INTO public."User" (
  id,
  email,
  name,
  phone,
  avatar,
  role,
  platform,
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT 
  au.id::text,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  au.raw_user_meta_data->>'phone',
  au.raw_user_meta_data->>'avatar_url',
  COALESCE((au.raw_user_meta_data->>'role')::public."Role", 'STUDENT'::"Role"),
  'BEDAYA'::"Platform",
  true,
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public."User" u WHERE u.id = au.id::text
)
ON CONFLICT (id) DO NOTHING;
