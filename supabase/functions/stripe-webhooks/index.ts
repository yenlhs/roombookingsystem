import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );

    console.log("Received Stripe event:", event.type, "ID:", event.id);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(supabase, event);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(supabase, event);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true, eventId: event.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function handleCheckoutSessionCompleted(
  supabase: any,
  event: Stripe.Event,
) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.mode !== "subscription") {
    console.log("Ignoring non-subscription checkout session");
    return;
  }

  const userId = session.metadata?.user_id;
  const tierId = session.metadata?.tier_id;

  if (!userId || !tierId) {
    console.error("Missing user_id or tier_id in session metadata");
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
  );

  // Create or update subscription in database
  const { error } = await supabase.from("user_subscriptions").upsert(
    {
      user_id: userId,
      tier_id: tierId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      current_period_start: new Date(
        subscription.current_period_start * 1000,
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000,
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    {
      onConflict: "stripe_subscription_id",
    },
  );

  if (error) {
    console.error("Failed to create subscription:", error);
    throw error;
  }

  // Log event
  await supabase.from("subscription_events").insert({
    user_id: userId,
    event_type:
      subscription.status === "trialing"
        ? "trial_started"
        : "subscription_created",
    stripe_event_id: event.id,
    metadata: {
      subscription_id: subscription.id,
      customer_id: subscription.customer,
      amount: session.amount_total,
      currency: session.currency,
    },
  });

  console.log(`Subscription created for user ${userId}`);
}

async function handleSubscriptionUpdated(supabase: any, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  // Find existing subscription record
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!existingSubscription) {
    console.log("Subscription not found in database, skipping update");
    return;
  }

  // Update subscription
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: subscription.status,
      current_period_start: new Date(
        subscription.current_period_start * 1000,
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000,
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancelled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to update subscription:", error);
    throw error;
  }

  // Log event
  await supabase.from("subscription_events").insert({
    user_id: existingSubscription.user_id,
    subscription_id: existingSubscription.id,
    event_type: subscription.cancel_at_period_end
      ? "subscription_cancelled"
      : "subscription_updated",
    stripe_event_id: event.id,
    metadata: {
      subscription_id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
  });

  console.log(`Subscription ${subscription.id} updated`);
}

async function handleSubscriptionDeleted(supabase: any, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  // Find existing subscription
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("id, user_id, tier_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!existingSubscription) {
    console.log("Subscription not found in database");
    return;
  }

  // Mark subscription as cancelled
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to cancel subscription:", error);
    throw error;
  }

  // Get free tier ID
  const { data: freeTier } = await supabase
    .from("subscription_tiers")
    .select("id")
    .eq("name", "free")
    .single();

  if (freeTier) {
    // Create new free subscription for user
    await supabase.from("user_subscriptions").insert({
      user_id: existingSubscription.user_id,
      tier_id: freeTier.id,
      status: "active",
    });
  }

  // Log event
  await supabase.from("subscription_events").insert({
    user_id: existingSubscription.user_id,
    subscription_id: existingSubscription.id,
    event_type: "subscription_cancelled",
    stripe_event_id: event.id,
    metadata: {
      subscription_id: subscription.id,
      cancelled_at: new Date().toISOString(),
    },
  });

  console.log(
    `Subscription ${subscription.id} deleted, user reverted to free tier`,
  );
}

async function handleInvoicePaymentSucceeded(
  supabase: any,
  event: Stripe.Event,
) {
  const invoice = event.data.object as Stripe.Invoice;

  if (!invoice.subscription) {
    console.log("Invoice not associated with subscription");
    return;
  }

  // Find subscription
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", invoice.subscription)
    .single();

  if (!existingSubscription) {
    console.log("Subscription not found for invoice");
    return;
  }

  // Log payment success event
  await supabase.from("subscription_events").insert({
    user_id: existingSubscription.user_id,
    subscription_id: existingSubscription.id,
    event_type: "payment_succeeded",
    stripe_event_id: event.id,
    metadata: {
      invoice_id: invoice.id,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
    },
  });

  console.log(`Payment succeeded for subscription ${invoice.subscription}`);
}

async function handleInvoicePaymentFailed(supabase: any, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  if (!invoice.subscription) {
    console.log("Invoice not associated with subscription");
    return;
  }

  // Find subscription
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", invoice.subscription)
    .single();

  if (!existingSubscription) {
    console.log("Subscription not found for invoice");
    return;
  }

  // Update subscription status to past_due
  await supabase
    .from("user_subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", invoice.subscription);

  // Log payment failure event
  await supabase.from("subscription_events").insert({
    user_id: existingSubscription.user_id,
    subscription_id: existingSubscription.id,
    event_type: "payment_failed",
    stripe_event_id: event.id,
    metadata: {
      invoice_id: invoice.id,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      attempt_count: invoice.attempt_count,
    },
  });

  console.log(`Payment failed for subscription ${invoice.subscription}`);
}
