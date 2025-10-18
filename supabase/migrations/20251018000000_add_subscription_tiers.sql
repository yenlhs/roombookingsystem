-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for active tiers
CREATE INDEX idx_subscription_tiers_active ON subscription_tiers(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated users can view active tiers
CREATE POLICY "Anyone can view active subscription tiers" ON subscription_tiers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can manage tiers
CREATE POLICY "Admins can manage subscription tiers" ON subscription_tiers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_subscription_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_tiers_updated_at();

-- Seed initial tiers
INSERT INTO subscription_tiers (name, display_name, description, price_monthly, features) VALUES
  ('free', 'Free Plan', 'Access to all standard rooms with basic booking features', 0.00, '{"exclusive_rooms": false, "max_concurrent_bookings": 3}'),
  ('premium', 'Premium Access', 'Unlock exclusive premium rooms and priority booking', 9.99, '{"exclusive_rooms": true, "max_concurrent_bookings": 10}')
ON CONFLICT (name) DO NOTHING;

-- Comment on table
COMMENT ON TABLE subscription_tiers IS 'Defines available subscription plans and their features';
COMMENT ON COLUMN subscription_tiers.features IS 'JSONB field containing feature flags for the tier';
COMMENT ON COLUMN subscription_tiers.stripe_price_id IS 'Stripe Price ID (e.g., price_1234...) for payment processing';
