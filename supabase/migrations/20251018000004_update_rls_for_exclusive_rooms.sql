-- Helper function to check if user has access to exclusive rooms
CREATE OR REPLACE FUNCTION user_has_exclusive_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_subscriptions us
    JOIN subscription_tiers st ON us.tier_id = st.id
    WHERE us.user_id = p_user_id
      AND us.status IN ('active', 'trialing')
      AND (st.features->>'exclusive_rooms')::boolean = true
      AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Comment on function
COMMENT ON FUNCTION user_has_exclusive_access IS 'Checks if user has an active premium subscription with exclusive room access';

-- Drop existing booking creation policy to recreate with exclusive room check
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;

-- Updated policy: Users can create bookings only if they have access to the room
CREATE POLICY "Users can create own bookings" ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    -- Either room is not exclusive...
    NOT EXISTS (
      SELECT 1 FROM rooms WHERE id = room_id AND is_exclusive = true AND status = 'active'
    )
    -- ...OR user has premium access
    OR user_has_exclusive_access(auth.uid())
  )
);

-- Policy for admins to create any booking (unchanged, but recreated for clarity)
DROP POLICY IF EXISTS "Admins can create any booking" ON bookings;

CREATE POLICY "Admins can create any booking" ON bookings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Helper function to check subscription tier (useful for frontend queries)
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS TABLE (
  tier_name TEXT,
  tier_display_name TEXT,
  has_exclusive_access BOOLEAN,
  subscription_status TEXT,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.name,
    st.display_name,
    (st.features->>'exclusive_rooms')::boolean,
    us.status,
    us.current_period_end
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Comment on function
COMMENT ON FUNCTION get_user_subscription_tier IS 'Returns the current active subscription tier details for a user';
