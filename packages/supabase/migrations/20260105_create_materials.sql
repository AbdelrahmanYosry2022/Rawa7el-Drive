-- Create MaterialType enum
DO $$ BEGIN
    CREATE TYPE "MaterialType" AS ENUM ('PDF', 'POWERPOINT', 'DOCUMENT', 'AUDIO', 'VIDEO', 'IMAGE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Material table for storing uploaded files
CREATE TABLE IF NOT EXISTS "Material" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MaterialType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER, -- For audio/video in seconds
    "pageCount" INTEGER, -- For PDF/documents
    "platform" "Platform" NOT NULL DEFAULT 'BEDAYA',
    "uploadedBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create CalendarEventMaterial junction table for linking materials to events
CREATE TABLE IF NOT EXISTS "CalendarEventMaterial" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "eventId" TEXT NOT NULL REFERENCES "CalendarEvent"("id") ON DELETE CASCADE,
    "materialId" TEXT NOT NULL REFERENCES "Material"("id") ON DELETE CASCADE,
    "order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("eventId", "materialId")
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "Material_type_idx" ON "Material"("type");
CREATE INDEX IF NOT EXISTS "Material_platform_idx" ON "Material"("platform");
CREATE INDEX IF NOT EXISTS "Material_uploadedBy_idx" ON "Material"("uploadedBy");
CREATE INDEX IF NOT EXISTS "CalendarEventMaterial_eventId_idx" ON "CalendarEventMaterial"("eventId");
CREATE INDEX IF NOT EXISTS "CalendarEventMaterial_materialId_idx" ON "CalendarEventMaterial"("materialId");

-- Enable RLS
ALTER TABLE "Material" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEventMaterial" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Material
CREATE POLICY "Users can view materials" ON "Material"
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload materials" ON "Material"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their materials" ON "Material"
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete their materials" ON "Material"
    FOR DELETE USING (true);

-- RLS Policies for CalendarEventMaterial
CREATE POLICY "Users can view event materials" ON "CalendarEventMaterial"
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can link materials" ON "CalendarEventMaterial"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update event materials" ON "CalendarEventMaterial"
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete event materials" ON "CalendarEventMaterial"
    FOR DELETE USING (true);
