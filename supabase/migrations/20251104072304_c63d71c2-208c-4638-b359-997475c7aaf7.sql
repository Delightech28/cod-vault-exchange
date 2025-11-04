-- Create storage bucket for listing videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-videos',
  'listing-videos',
  true,
  52428800, -- 50MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
);

-- Create storage policies for listing videos
CREATE POLICY "Authenticated users can upload listing videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view listing videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'listing-videos');

CREATE POLICY "Users can update their own listing videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own listing videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'listing-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add video_url column to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS video_url TEXT;