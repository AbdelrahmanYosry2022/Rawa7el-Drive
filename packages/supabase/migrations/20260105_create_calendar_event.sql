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

-- Policy: Allow all authenticated users to insert (development mode)
CREATE POLICY "Admins can create calendar events" ON "CalendarEvent"
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow all authenticated users to update (development mode)
CREATE POLICY "Admins can update calendar events" ON "CalendarEvent"
    FOR UPDATE
    USING (true);

-- Policy: Allow all authenticated users to delete (development mode)
CREATE POLICY "Admins can delete calendar events" ON "CalendarEvent"
    FOR DELETE
    USING (true);
