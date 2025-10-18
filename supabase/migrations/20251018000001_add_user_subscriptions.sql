-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES subscription_tiers(id) NOT NULL,

  -- Stripe subscription details
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Subscription lifecycle
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure only one active subscription per user
  CONSTRAINT unique_active_user_subscription UNIQUE (user_id)
    WHERE (status = 'active' OR status = 'trialing'),

  -- Validate status values
  CONSTRAINT valid_subscription_status CHECK (
    status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')
  )
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_user_subscriptions_period_end ON user_subscriptions(current_period_end) WHERE status IN ('active', 'trialing');

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view their own subscriptions
CREATE POLICY "Users view own subscriptions" ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins view all subscriptions" ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Only service role can insert/update/delete subscriptions (via Edge Functions)
-- No INSERT/UPDATE/DELETE policies for regular users or admins

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- Function to automatically create free tier subscription for new users
CREATE OR REPLACE FUNCTION create_free_subscription_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  free_tier_id UUID;
BEGIN
  -- Get the free tier ID
  SELECT id INTO free_tier_id
  FROM subscription_tiers
  WHERE name = 'free' AND is_active = true
  LIMIT 1;

  -- Create a free subscription for the new user
  IF free_tier_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (user_id, tier_id, status)
    VALUES (NEW.id, free_tier_id, 'active');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create free subscription on user signup
CREATE TRIGGER trigger_create_free_subscription
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription_for_new_user();

-- Comment on table
COMMENT ON TABLE user_subscriptions IS 'Tracks user subscription status and Stripe integration';
COMMENT ON COLUMN user_subscriptions.status IS 'Stripe subscription status: active, cancelled, past_due, trialing, incomplete, incomplete_expired, unpaid';
COMMENT ON COLUMN user_subscriptions.cancel_at_period_end IS 'True if subscription will cancel at end of current period';
