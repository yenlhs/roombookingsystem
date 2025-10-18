import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

interface CheckoutRequest {
  tier_id: string;
  success_url?: string;
  cancel_url?: string;
}

serve(async (req) => {
  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const { tier_id, success_url, cancel_url }: CheckoutRequest = await req.json();

    if (!tier_id) {
      return new Response(
        JSON.stringify({ error: 'tier_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get tier details
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', tier_id)
      .single();

    if (tierError || !tier) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Don't allow checkout for free tier
    if (tier.name === 'free') {
      return new Response(
        JSON.stringify({ error: 'Cannot create checkout for free tier' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!tier.stripe_price_id) {
      return new Response(
        JSON.stringify({ error: 'Tier does not have Stripe price configured' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user details
    const { data: userProfile } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*, tier:subscription_tiers(*)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();

    let sessionParams: Stripe.Checkout.SessionCreateParams;

    if (existingSubscription && existingSubscription.stripe_customer_id) {
      // User has existing subscription - create session for subscription update
      sessionParams = {
        mode: 'subscription',
        customer: existingSubscription.stripe_customer_id,
        line_items: [
          {
            price: tier.stripe_price_id,
            quantity: 1,
          },
        ],
        success_url: success_url || `${SUPABASE_URL}/subscription/success`,
        cancel_url: cancel_url || `${SUPABASE_URL}/subscription/cancel`,
        subscription_data: {
          metadata: {
            user_id: user.id,
            tier_id: tier_id,
          },
        },
        metadata: {
          user_id: user.id,
          tier_id: tier_id,
        },
      };
    } else {
      // New subscription
      sessionParams = {
        mode: 'subscription',
        customer_email: userProfile?.email || user.email,
        line_items: [
          {
            price: tier.stripe_price_id,
            quantity: 1,
          },
        ],
        success_url: success_url || `${SUPABASE_URL}/subscription/success`,
        cancel_url: cancel_url || `${SUPABASE_URL}/subscription/cancel`,
        subscription_data: {
          metadata: {
            user_id: user.id,
            tier_id: tier_id,
          },
        },
        metadata: {
          user_id: user.id,
          tier_id: tier_id,
        },
        customer_creation: 'always',
      };

      // Add customer name if available
      if (userProfile?.full_name) {
        sessionParams.customer_email = userProfile.email;
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        tier: {
          name: tier.name,
          display_name: tier.display_name,
          price_monthly: tier.price_monthly,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
