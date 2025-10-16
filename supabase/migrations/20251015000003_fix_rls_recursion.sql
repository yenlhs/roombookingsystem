-- ============================================
-- Room Booking System - Fix RLS Infinite Recursion
-- Migration: 20251015000003_fix_rls_recursion
-- Description: Fix infinite recursion in RLS policies by using helper functions
-- ============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can create any booking" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view active rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can delete rooms" ON public.rooms;

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- Using SECURITY DEFINER to bypass RLS
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RECREATE RLS POLICIES - USERS TABLE
-- ============================================

-- Admins can read all users (using helper function)
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can update any user (using helper function)
CREATE POLICY "Admins can update users"
  ON public.users
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Admins can insert users (using helper function)
CREATE POLICY "Admins can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- RECREATE RLS POLICIES - ROOMS TABLE
-- ============================================

-- All authenticated users can view active rooms, admins can view all
CREATE POLICY "Users can view active rooms"
  ON public.rooms
  FOR SELECT
  USING (
    status = 'active'
    OR public.is_admin(auth.uid())
  );

-- Only admins can insert rooms
CREATE POLICY "Admins can create rooms"
  ON public.rooms
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update rooms
CREATE POLICY "Admins can update rooms"
  ON public.rooms
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Only admins can delete rooms
CREATE POLICY "Admins can delete rooms"
  ON public.rooms
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- RECREATE RLS POLICIES - BOOKINGS TABLE
-- ============================================

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admins can create bookings for anyone
CREATE POLICY "Admins can create any booking"
  ON public.bookings
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update any booking
CREATE POLICY "Admins can update any booking"
  ON public.bookings
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Only admins can delete bookings
CREATE POLICY "Admins can delete bookings"
  ON public.bookings
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- UPDATE STORAGE POLICIES
-- ============================================

-- Drop and recreate storage policies using the helper function

-- Avatars
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;
CREATE POLICY "Admins can manage all avatars"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.is_admin(auth.uid())
  );

-- Rooms (if migration has been applied)
DROP POLICY IF EXISTS "Admins can upload room images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update room images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete room images" ON storage.objects;

CREATE POLICY "Admins can upload room images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rooms'
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can update room images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'rooms'
    AND public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can delete room images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'rooms'
    AND public.is_admin(auth.uid())
  );
