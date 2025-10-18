-- Create subscription_events table for audit trail
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validate event types
  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'subscription_created',
      'subscription_updated',
      'subscription_cancelled',
      'subscription_renewed',
      'payment_succeeded',
      'payment_failed',
      'trial_started',
      'trial_ended'
    )
  )
);

-- Indexes for querying events
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at DESC);
CREATE INDEX idx_subscription_events_stripe_event_id ON subscription_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);

-- Enable RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view their own subscription events
CREATE POLICY "Users view own subscription events" ON subscription_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all subscription events
CREATE POLICY "Admins view all subscription events" ON subscription_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Only service role can insert events (via Edge Functions)
-- No INSERT/UPDATE/DELETE policies for regular users or admins

-- Comment on table
COMMENT ON TABLE subscription_events IS 'Audit log of all subscription lifecycle events';
COMMENT ON COLUMN subscription_events.event_type IS 'Type of subscription event that occurred';
COMMENT ON COLUMN subscription_events.stripe_event_id IS 'Stripe webhook event ID for idempotency';
COMMENT ON COLUMN subscription_events.metadata IS 'Additional event data (prices, changes, error details, etc.)';
