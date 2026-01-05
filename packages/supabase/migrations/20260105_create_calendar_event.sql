-- Create CalendarEventStatus enum
CREATE TYPE "CalendarEventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- Create CalendarEvent table for Bedaya project calendar
CREATE TABLE "CalendarEvent" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "startTime" TIME,
    "endTime" TIME,
    "location" TEXT,
    "speakers" JSONB,
    "status" "CalendarEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "platform" "Platform" NOT NULL DEFAULT 'BEDAYA',
    "createdBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX "CalendarEvent_date_idx" ON "CalendarEvent"("date");
CREATE INDEX "CalendarEvent_platform_idx" ON "CalendarEvent"("platform");
CREATE INDEX "CalendarEvent_status_idx" ON "CalendarEvent"("status");

-- Enable RLS
ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view calendar events for their platform
CREATE POLICY "Users can view calendar events" ON "CalendarEvent"
    FOR SELECT
    USING (true);

-- Policy: Only admins can insert calendar events
CREATE POLICY "Admins can create calendar events" ON "CalendarEvent"
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User"."id" = auth.uid()::text
            AND "User"."role" IN ('SUPER_ADMIN', 'ADMIN', 'TEACHER')
        )
    );

-- Policy: Only admins can update calendar events
CREATE POLICY "Admins can update calendar events" ON "CalendarEvent"
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User"."id" = auth.uid()::text
            AND "User"."role" IN ('SUPER_ADMIN', 'ADMIN', 'TEACHER')
        )
    );

-- Policy: Only admins can delete calendar events
CREATE POLICY "Admins can delete calendar events" ON "CalendarEvent"
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM "User"
            WHERE "User"."id" = auth.uid()::text
            AND "User"."role" IN ('SUPER_ADMIN', 'ADMIN', 'TEACHER')
        )
    );
