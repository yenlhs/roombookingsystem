-- ============================================
-- Room Booking System - Room Images Storage
-- Migration: 20251015000002_storage_rooms
-- Description: Create storage bucket for room images with RLS policies
-- ============================================

-- ============================================
-- CREATE STORAGE BUCKET FOR ROOM IMAGES
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rooms',
  'rooms',
  true, -- Public bucket (files are accessible via URL)
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
);

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Allow admins to upload room images
CREATE POLICY "Admins can upload room images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rooms'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update room images
CREATE POLICY "Admins can update room images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'rooms'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete room images
CREATE POLICY "Admins can delete room images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'rooms'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow anyone to view room images (public bucket)
CREATE POLICY "Anyone can view room images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'rooms');
