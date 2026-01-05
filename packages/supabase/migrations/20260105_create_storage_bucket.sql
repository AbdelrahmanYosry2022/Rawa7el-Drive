-- Create storage bucket for Bedaya materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bedaya-materials',
  'bedaya-materials',
  true,
  104857600, -- 100MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for bedaya-materials bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bedaya-materials');

-- Allow anyone to view/download files (public bucket)
CREATE POLICY "Anyone can view materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bedaya-materials');

-- Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'bedaya-materials');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bedaya-materials');
