-- ============================================
-- Room Booking System - Storage Setup
-- Migration: 20251015000001_storage_avatars
-- Description: Create storage bucket for user avatars with RLS policies
-- ============================================

-- ============================================
-- CREATE STORAGE BUCKET FOR AVATARS
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket (files are accessible via URL)
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
);

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Allow authenticated users to upload avatars to their own folder
CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to read avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Admins can manage all avatars
CREATE POLICY "Admins can manage all avatars"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
