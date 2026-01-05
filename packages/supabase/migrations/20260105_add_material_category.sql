-- Add category column to Material table for library organization
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'other';

-- Create index for category
CREATE INDEX IF NOT EXISTS "Material_category_idx" ON "Material"("category");
