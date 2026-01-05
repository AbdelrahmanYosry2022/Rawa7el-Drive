-- Create Lecture table for managing lectures with instructor info
CREATE TABLE IF NOT EXISTS "Lecture" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "instructorName" TEXT,
    "instructorBio" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "isPublished" BOOLEAN DEFAULT false,
    "order" INTEGER DEFAULT 0,
    "platform" "Platform" NOT NULL DEFAULT 'BEDAYA',
    "createdBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create LectureMaterial junction table (link lectures to materials)
CREATE TABLE IF NOT EXISTS "LectureMaterial" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "lectureId" TEXT NOT NULL REFERENCES "Lecture"("id") ON DELETE CASCADE,
    "materialId" TEXT NOT NULL REFERENCES "Material"("id") ON DELETE CASCADE,
    "order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("lectureId", "materialId")
);

-- Create LectureSchedule junction table (link lectures to calendar events/schedules)
CREATE TABLE IF NOT EXISTS "LectureSchedule" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "lectureId" TEXT NOT NULL REFERENCES "Lecture"("id") ON DELETE CASCADE,
    "eventId" TEXT NOT NULL REFERENCES "CalendarEvent"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE("lectureId", "eventId")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Lecture_instructorId_idx" ON "Lecture"("instructorId");
CREATE INDEX IF NOT EXISTS "Lecture_platform_idx" ON "Lecture"("platform");
CREATE INDEX IF NOT EXISTS "LectureMaterial_lectureId_idx" ON "LectureMaterial"("lectureId");
CREATE INDEX IF NOT EXISTS "LectureMaterial_materialId_idx" ON "LectureMaterial"("materialId");
CREATE INDEX IF NOT EXISTS "LectureSchedule_lectureId_idx" ON "LectureSchedule"("lectureId");
CREATE INDEX IF NOT EXISTS "LectureSchedule_eventId_idx" ON "LectureSchedule"("eventId");

-- Enable RLS
ALTER TABLE "Lecture" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LectureMaterial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LectureSchedule" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Lecture
CREATE POLICY "view_lectures" ON "Lecture" FOR SELECT USING (true);
CREATE POLICY "insert_lectures" ON "Lecture" FOR INSERT WITH CHECK (true);
CREATE POLICY "update_lectures" ON "Lecture" FOR UPDATE USING (true);
CREATE POLICY "delete_lectures" ON "Lecture" FOR DELETE USING (true);

-- RLS Policies for LectureMaterial
CREATE POLICY "view_lecture_materials" ON "LectureMaterial" FOR SELECT USING (true);
CREATE POLICY "insert_lecture_materials" ON "LectureMaterial" FOR INSERT WITH CHECK (true);
CREATE POLICY "update_lecture_materials" ON "LectureMaterial" FOR UPDATE USING (true);
CREATE POLICY "delete_lecture_materials" ON "LectureMaterial" FOR DELETE USING (true);

-- RLS Policies for LectureSchedule
CREATE POLICY "view_lecture_schedules" ON "LectureSchedule" FOR SELECT USING (true);
CREATE POLICY "insert_lecture_schedules" ON "LectureSchedule" FOR INSERT WITH CHECK (true);
CREATE POLICY "update_lecture_schedules" ON "LectureSchedule" FOR UPDATE USING (true);
CREATE POLICY "delete_lecture_schedules" ON "LectureSchedule" FOR DELETE USING (true);
