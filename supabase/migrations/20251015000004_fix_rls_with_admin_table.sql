-- ============================================
-- Room Booking System - Fix RLS with Admin Table
-- Migration: 20251015000004_fix_rls_with_admin_table
-- Description: Create a separate admin tracking table to avoid RLS recursion
-- ============================================

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Drop all admin-related policies
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
-- CREATE ADMIN CACHE TABLE (NO RLS)
-- This table tracks admin users to avoid recursion
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- No RLS on this table - it's only used for lookups
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- ============================================
-- FUNCTION: Sync admin users from users table
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_admin_users()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is being set to admin, add to admin_users
  IF NEW.role = 'admin' THEN
    INSERT INTO public.admin_users (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  -- If user is being removed from admin, remove from admin_users
  ELSIF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    DELETE FROM public.admin_users WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to keep admin_users in sync
DROP TRIGGER IF EXISTS sync_admin_users_trigger ON public.users;
CREATE TRIGGER sync_admin_users_trigger
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_admin_users();

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- Uses the admin_users table (no RLS)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE admin_users.user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- POPULATE admin_users table with existing admins
-- ============================================

INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- RECREATE RLS POLICIES - USERS TABLE
-- ============================================

CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update users"
  ON public.users
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- RECREATE RLS POLICIES - ROOMS TABLE
-- ============================================

CREATE POLICY "Users can view active rooms"
  ON public.rooms
  FOR SELECT
  USING (
    status = 'active'
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can create rooms"
  ON public.rooms
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update rooms"
  ON public.rooms
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete rooms"
  ON public.rooms
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- RECREATE RLS POLICIES - BOOKINGS TABLE
-- ============================================

CREATE POLICY "Admins can view all bookings"
  ON public.bookings
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create any booking"
  ON public.bookings
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any booking"
  ON public.bookings
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete bookings"
  ON public.bookings
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================
-- UPDATE STORAGE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;
CREATE POLICY "Admins can manage all avatars"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.is_admin(auth.uid())
  );

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
