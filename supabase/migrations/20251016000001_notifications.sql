-- ============================================
-- Notification System
-- Migration: 20251016000001_notifications
-- Description: Push notification tokens and email notification preferences
-- ============================================

-- ============================================
-- PUSH NOTIFICATION TOKENS TABLE
-- ============================================

-- Store push notification tokens for mobile devices
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('expo', 'fcm', 'apns')),
  device_id TEXT,
  device_name TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android')),
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique tokens per user
  UNIQUE(user_id, token)
);

-- Index for quick lookups by user
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id)
  WHERE is_active = true;

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token)
  WHERE is_active = true;

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================

-- User notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,

  -- Email notifications
  email_enabled BOOLEAN DEFAULT true,
  email_booking_confirmed BOOLEAN DEFAULT true,
  email_booking_cancelled BOOLEAN DEFAULT true,
  email_booking_reminder BOOLEAN DEFAULT true,
  email_booking_reminder_minutes INTEGER DEFAULT 30 CHECK (email_booking_reminder_minutes > 0),

  -- Push notifications
  push_enabled BOOLEAN DEFAULT true,
  push_booking_confirmed BOOLEAN DEFAULT true,
  push_booking_cancelled BOOLEAN DEFAULT true,
  push_booking_reminder BOOLEAN DEFAULT true,
  push_booking_reminder_minutes INTEGER DEFAULT 15 CHECK (push_booking_reminder_minutes > 0),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create default preferences when user is created
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences on user creation
DROP TRIGGER IF EXISTS trigger_create_notification_preferences ON public.users;
CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- ============================================
-- NOTIFICATION LOG TABLE
-- ============================================

-- Log all sent notifications for debugging and analytics
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      'booking_confirmed',
      'booking_cancelled',
      'booking_reminder',
      'booking_updated'
    )
  ),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  recipient TEXT NOT NULL, -- email address or push token
  subject TEXT,
  body TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics and debugging
CREATE INDEX IF NOT EXISTS idx_notification_log_user_id ON public.notification_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_booking_id ON public.notification_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON public.notification_log(status)
  WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON public.notification_log(notification_type, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Push tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push tokens"
  ON public.push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
  ON public.push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON public.push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON public.push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification log (read-only for users, admins can see all)
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification log"
  ON public.notification_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification logs"
  ON public.notification_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get active push tokens for a user
CREATE OR REPLACE FUNCTION public.get_user_push_tokens(p_user_id UUID)
RETURNS TABLE (
  token TEXT,
  token_type TEXT,
  platform TEXT
) AS $$
BEGIN
  -- Update last_used_at for tokens being retrieved
  UPDATE public.push_tokens
  SET last_used_at = NOW()
  WHERE user_id = p_user_id AND is_active = true;

  RETURN QUERY
  SELECT
    pt.token,
    pt.token_type,
    pt.platform
  FROM public.push_tokens pt
  WHERE pt.user_id = p_user_id
    AND pt.is_active = true
  ORDER BY pt.last_used_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register or update a push token
CREATE OR REPLACE FUNCTION public.register_push_token(
  p_user_id UUID,
  p_token TEXT,
  p_token_type TEXT,
  p_device_id TEXT DEFAULT NULL,
  p_device_name TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT NULL,
  p_app_version TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_token_id UUID;
BEGIN
  -- Insert or update token
  INSERT INTO public.push_tokens (
    user_id,
    token,
    token_type,
    device_id,
    device_name,
    platform,
    app_version,
    is_active,
    last_used_at
  ) VALUES (
    p_user_id,
    p_token,
    p_token_type,
    p_device_id,
    p_device_name,
    p_platform,
    p_app_version,
    true,
    NOW()
  )
  ON CONFLICT (user_id, token)
  DO UPDATE SET
    is_active = true,
    device_id = COALESCE(EXCLUDED.device_id, push_tokens.device_id),
    device_name = COALESCE(EXCLUDED.device_name, push_tokens.device_name),
    platform = COALESCE(EXCLUDED.platform, push_tokens.platform),
    app_version = COALESCE(EXCLUDED.app_version, push_tokens.app_version),
    last_used_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deactivate a push token
CREATE OR REPLACE FUNCTION public.deactivate_push_token(
  p_user_id UUID,
  p_token TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.push_tokens
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND token = p_token;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.push_tokens IS 'Stores push notification tokens for mobile devices';
COMMENT ON TABLE public.notification_preferences IS 'User preferences for email and push notifications';
COMMENT ON TABLE public.notification_log IS 'Log of all sent notifications for debugging and analytics';

COMMENT ON FUNCTION public.get_user_push_tokens IS 'Get all active push tokens for a user';
COMMENT ON FUNCTION public.register_push_token IS 'Register or update a push notification token';
COMMENT ON FUNCTION public.deactivate_push_token IS 'Deactivate a push notification token';

-- ============================================
-- INITIAL DATA
-- ============================================

-- Create default notification preferences for existing users
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;
