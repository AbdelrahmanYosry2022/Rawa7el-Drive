-- Create invitation_links table for student registration
-- Run this migration in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS invitation_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token VARCHAR(20) UNIQUE NOT NULL,
  label VARCHAR(255),
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_invitation_links_token ON invitation_links(token);

-- Enable Row Level Security
ALTER TABLE invitation_links ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to manage invitation links
CREATE POLICY "Admins can manage invitation links" ON invitation_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User" 
      WHERE id = auth.uid()::text 
      AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')
    )
  );

-- Policy: Allow public read for token validation (needed for registration)
CREATE POLICY "Public can validate tokens" ON invitation_links
  FOR SELECT
  USING (true);

-- Optional: Function to increment uses_count atomically
CREATE OR REPLACE FUNCTION increment_invitation_uses(invitation_token VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE invitation_links 
  SET uses_count = uses_count + 1 
  WHERE token = invitation_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
