-- Run this in Supabase SQL Editor to fix RLS policies

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to create attendance sessions" ON "AttendanceSession";
DROP POLICY IF EXISTS "Allow authenticated users to read attendance sessions" ON "AttendanceSession";
DROP POLICY IF EXISTS "Allow public to read attendance sessions" ON "AttendanceSession";
DROP POLICY IF EXISTS "Allow authenticated users to create attendance" ON "Attendance";
DROP POLICY IF EXISTS "Allow public to create attendance" ON "Attendance";
DROP POLICY IF EXISTS "Allow authenticated users to read attendance" ON "Attendance";
DROP POLICY IF EXISTS "Allow public to create users" ON "User";
DROP POLICY IF EXISTS "Allow public to read users by phone" ON "User";

-- AttendanceSession policies
CREATE POLICY "Allow authenticated users to create attendance sessions"
ON "AttendanceSession"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read attendance sessions"
ON "AttendanceSession"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow public to read attendance sessions"
ON "AttendanceSession"
FOR SELECT
TO anon
USING (true);

-- Attendance policies
CREATE POLICY "Allow authenticated users to create attendance"
ON "Attendance"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow public to create attendance"
ON "Attendance"
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read attendance"
ON "Attendance"
FOR SELECT
TO authenticated
USING (true);

-- User policies for public registration
CREATE POLICY "Allow public to create users"
ON "User"
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow public to read users by phone"
ON "User"
FOR SELECT
TO anon
USING (phone LIKE 'visitor:%');
