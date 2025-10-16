-- ============================================
-- IMPORTANT: Run this ENTIRE script in Supabase SQL Editor
-- This will fix the infinite recursion RLS error
-- ============================================

-- Step 1: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

DROP POLICY IF EXISTS "Users can view active rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can delete rooms" ON public.rooms;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can create any booking" ON public.bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update any booking" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;

-- Step 2: Create admin cache table (NO RLS on this table!)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure no RLS on admin_users
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- Step 3: Populate admin_users from existing data
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Create trigger to keep admin_users synced
CREATE OR REPLACE FUNCTION public.sync_admin_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.admin_users (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    DELETE FROM public.admin_users WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_admin_users_trigger ON public.users;
CREATE TRIGGER sync_admin_users_trigger
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_admin_users();

-- Step 5: Create is_admin helper function (queries admin_users, NOT users)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 6: Recreate USERS table policies (using is_admin helper)
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Step 7: Recreate ROOMS table policies
CREATE POLICY "Users can view active rooms"
  ON public.rooms FOR SELECT
  USING (status = 'active' OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update rooms"
  ON public.rooms FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete rooms"
  ON public.rooms FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Step 8: Recreate BOOKINGS table policies
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create any booking"
  ON public.bookings FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can cancel own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('confirmed', 'cancelled'));

CREATE POLICY "Admins can update any booking"
  ON public.bookings FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Step 9: Show results
SELECT 'Migration completed successfully!' as status;
SELECT 'Admin users count: ' || COUNT(*)::text as admin_count FROM public.admin_users;
