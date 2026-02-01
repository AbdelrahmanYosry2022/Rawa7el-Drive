-- Add invited_by column to User table to track which invitation link was used
-- Run this in Supabase SQL Editor

-- Add the column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS invited_by TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_invited_by ON "User"(invited_by);

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'invited_by';
