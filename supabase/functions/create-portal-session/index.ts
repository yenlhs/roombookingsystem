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

interface PortalRequest {
  return_url?: string;
}

serve(async (req) => {
  try {
    console.log("[1] Portal session function started");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[2] Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("[3] Creating Supabase client");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    console.log("[4] Getting authenticated user");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[5] User authentication failed:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[6] User authenticated:", user.id);

    // Parse request
    const { return_url }: PortalRequest = await req.json();
    console.log("[7] Return URL:", return_url);

    // Get user's subscription with Stripe customer ID
    console.log("[8] Fetching user subscription");
    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due", "cancelled"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    console.log("[9] Subscription query result:", {
      subscription,
      subscriptionError,
    });

    if (subscriptionError || !subscription) {
      console.error("[10] No subscription found:", subscriptionError);
      return new Response(
        JSON.stringify({ error: "No subscription found for user" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!subscription.stripe_customer_id) {
      console.error("[11] No Stripe customer ID found");
      return new Response(
        JSON.stringify({ error: "No Stripe customer ID found" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(
      "[12] Creating Stripe portal session for customer:",
      subscription.stripe_customer_id,
    );

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: return_url || `${SUPABASE_URL}/subscription`,
    });

    console.log("[13] Portal session created successfully:", portalSession.id);

    return new Response(
      JSON.stringify({
        url: portalSession.url,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[ERROR] Error creating portal session:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
