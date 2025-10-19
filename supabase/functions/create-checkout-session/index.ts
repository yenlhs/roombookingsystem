import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

interface CheckoutRequest {
  tier_id: string;
  success_url?: string;
  cancel_url?: string;
}

serve(async (req) => {
  try {
    console.log("[1] Function started");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("[ERROR] Missing auth header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("[2] Creating Supabase client");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    console.log("[3] Getting authenticated user");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("[ERROR] User auth failed:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[4] User authenticated:", user.id);

    // Parse request
    console.log("[5] Parsing request body");
    const { tier_id, success_url, cancel_url }: CheckoutRequest =
      await req.json();
    console.log("[6] Request parsed. Tier ID:", tier_id);

    if (!tier_id) {
      return new Response(JSON.stringify({ error: "tier_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get tier details
    console.log("[7] Fetching tier details");
    const { data: tier, error: tierError } = await supabase
      .from("subscription_tiers")
      .select("*")
      .eq("id", tier_id)
      .single();

    if (tierError || !tier) {
      console.log("[ERROR] Tier not found:", tierError?.message);
      return new Response(JSON.stringify({ error: "Invalid tier_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[8] Tier found:", tier.name);

    // Don't allow checkout for free tier
    if (tier.name === "free") {
      console.log("[ERROR] Free tier checkout attempted");
      return new Response(
        JSON.stringify({ error: "Cannot create checkout for free tier" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!tier.stripe_price_id) {
      console.log("[ERROR] No Stripe price ID");
      return new Response(
        JSON.stringify({ error: "Tier does not have Stripe price configured" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("[9] Stripe price ID:", tier.stripe_price_id);

    // Get user details
    console.log("[10] Fetching user profile");
    const { data: userProfile } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    console.log("[11] User profile:", userProfile?.email);

    // Check if user already has an active subscription
    console.log("[12] Checking for existing subscription");
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("*, tier:subscription_tiers(*)")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .single();

    console.log(
      "[13] Existing subscription:",
      existingSubscription ? "Yes" : "No",
    );

    let sessionParams: Stripe.Checkout.SessionCreateParams;

    if (existingSubscription && existingSubscription.stripe_customer_id) {
      // User has existing subscription - create session for subscription update
      sessionParams = {
        mode: "subscription",
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
        mode: "subscription",
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
        // Note: customer_creation is not needed for subscription mode
        // Stripe automatically creates a customer when customer_email is provided
      };

      // Add customer name if available
      if (userProfile?.full_name) {
        sessionParams.customer_email = userProfile.email;
      }
    }

    // Create Stripe checkout session
    console.log(
      "Creating Stripe checkout session with params:",
      JSON.stringify(sessionParams, null, 2),
    );

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
      console.log("Stripe checkout session created successfully:", session.id);
    } catch (stripeError) {
      console.error("Stripe API error:", stripeError);
      console.error("Stripe error type:", (stripeError as any).type);
      console.error("Stripe error message:", (stripeError as any).message);
      console.error("Stripe error code:", (stripeError as any).code);
      throw new Error(
        `Stripe error: ${(stripeError as any).message || stripeError}`,
      );
    }

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
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    console.error("Error details:", JSON.stringify(error, null, 2));

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorType = (error as any).type;
    const errorCode = (error as any).code;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        stack: errorStack,
        type: errorType,
        code: errorCode,
        fullError: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
