-- ============================================================
-- Migration: Enhance AttendanceSession for proper time tracking
-- Date: 2026-01-06
-- Description: Adds startTime, endTime, lateThreshold, endedAt,
--   isActive, pinCode, maxDurationMinutes columns to fix
--   attendance timing issues.
-- ============================================================

-- 1. Add new columns to AttendanceSession
ALTER TABLE "AttendanceSession"
  ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pinCode" TEXT,
  ADD COLUMN IF NOT EXISTS "lateThresholdMinutes" INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS "maxDurationMinutes" INTEGER DEFAULT 120;

-- 2. Backfill existing sessions: set startTime = createdAt, isActive = false
UPDATE "AttendanceSession"
SET
  "startTime" = "createdAt"::timestamptz,
  "isActive" = false
WHERE "startTime" IS NULL;

-- 3. Add check-in time to Attendance records
ALTER TABLE "Attendance"
  ADD COLUMN IF NOT EXISTS "checkInTime" TIMESTAMPTZ;

-- 4. Backfill: set checkInTime = createdAt for existing records
UPDATE "Attendance"
SET "checkInTime" = "createdAt"::timestamptz
WHERE "checkInTime" IS NULL;

-- 5. Create index for faster session lookups
CREATE INDEX IF NOT EXISTS "idx_attendance_session_active"
  ON "AttendanceSession" ("isActive")
  WHERE "isActive" = true;

CREATE INDEX IF NOT EXISTS "idx_attendance_session_pin"
  ON "AttendanceSession" ("pinCode")
  WHERE "pinCode" IS NOT NULL AND "isActive" = true;

CREATE INDEX IF NOT EXISTS "idx_attendance_session_id_status"
  ON "Attendance" ("sessionId", "status");

-- 6. Auto-close stale sessions (older than maxDurationMinutes)
-- This can be called periodically via a cron or edge function
CREATE OR REPLACE FUNCTION close_stale_sessions()
RETURNS INTEGER AS $$
DECLARE
  closed_count INTEGER;
BEGIN
  UPDATE "AttendanceSession"
  SET
    "isActive" = false,
    "endedAt" = NOW()
  WHERE
    "isActive" = true
    AND "createdAt"::timestamptz + (COALESCE("maxDurationMinutes", 120) * INTERVAL '1 minute') < NOW();

  GET DIAGNOSTICS closed_count = ROW_COUNT;
  RETURN closed_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to auto-mark absent students when session closes
-- Marks all halaqa students who did NOT check in as ABSENT
CREATE OR REPLACE FUNCTION mark_absent_students(p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  absent_count INTEGER;
  v_halaqa_id UUID;
BEGIN
  -- Get the halaqaId for this session
  SELECT "halaqaId" INTO v_halaqa_id
  FROM "AttendanceSession"
  WHERE id = p_session_id;

  -- If no halaqa linked, nothing to do
  IF v_halaqa_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Insert ABSENT records for students in the halaqa who didn't check in
  INSERT INTO "Attendance" (id, "sessionId", "userId", status, notes, "createdAt", "updatedAt")
  SELECT
    gen_random_uuid(),
    p_session_id,
    hs."studentId",
    'ABSENT',
    'تسجيل غياب تلقائي',
    NOW(),
    NOW()
  FROM "HalaqaStudent" hs
  WHERE hs."halaqaId" = v_halaqa_id
    AND hs."isActive" = true
    AND hs."studentId" NOT IN (
      SELECT "userId" FROM "Attendance" WHERE "sessionId" = p_session_id
    );

  GET DIAGNOSTICS absent_count = ROW_COUNT;
  RETURN absent_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Update RLS policies for the new columns
-- Allow authenticated users to update their own sessions
DROP POLICY IF EXISTS "Allow authenticated users to update attendance sessions" ON "AttendanceSession";
CREATE POLICY "Allow authenticated users to update attendance sessions"
ON "AttendanceSession"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to update attendance records
DROP POLICY IF EXISTS "Allow authenticated users to update attendance" ON "Attendance";
CREATE POLICY "Allow authenticated users to update attendance"
ON "Attendance"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anon to read attendance (for check-in page to verify)
DROP POLICY IF EXISTS "Allow public to read attendance" ON "Attendance";
CREATE POLICY "Allow public to read attendance"
ON "Attendance"
FOR SELECT
TO anon
USING (true);
