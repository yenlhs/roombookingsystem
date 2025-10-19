# Subscription Feature Implementation Guide

This guide documents the implementation of the paid subscription feature for exclusive rooms.

## Overview

The subscription system allows mobile users to pay for a premium subscription to access exclusive rooms. The implementation includes:

- ✅ **Phase 1-2**: Database schema and RLS policies
- ✅ **Phase 3**: Stripe Edge Functions for webhooks and payment processing
- ✅ **Phase 4**: TypeScript types, Zod validation, and SubscriptionService
- ✅ **Phase 5**: Stripe React Native SDK installed
- 🔲 **Phase 5-6**: Mobile and Web UI (Implementation examples below)
- 🔲 **Phase 7**: Testing and deployment

---

## ✅ Completed Implementation

### Database Migrations

All migrations have been created in `supabase/migrations/`:

1. `20251018000000_add_subscription_tiers.sql` - Subscription plans (free, premium)
2. `20251018000001_add_user_subscriptions.sql` - User subscription records
3. `20251018000002_add_subscription_events.sql` - Audit trail
4. `20251018000003_add_rooms_is_exclusive.sql` - Mark rooms as exclusive
5. `20251018000004_update_rls_for_exclusive_rooms.sql` - Access control

**To apply migrations:**

```bash
# Local development
cd supabase
supabase db reset

# Production
supabase db push
```

### Edge Functions

Three Stripe integration functions have been created:

1. **`stripe-webhooks`** - Handles Stripe webhook events
   - checkout.session.completed
   - customer.subscription.created/updated/deleted
   - invoice.payment_succeeded/failed

2. **`create-checkout-session`** - Creates Stripe checkout for mobile/web
3. **`create-portal-session`** - Creates billing portal for subscription management

**To deploy Edge Functions:**

```bash
supabase functions deploy stripe-webhooks
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
```

### Shared Packages

- **Types**: Added subscription types to `packages/types/src/index.ts`
- **Validation**: Added Zod schemas to `packages/validation/src/subscription.ts`
- **Service**: Created `SubscriptionService` in `packages/supabase/src/services/subscription.ts`

---

## 🔲 Remaining Mobile App Implementation (Phase 5)

### 1. Configure Stripe Provider

**File**: `apps/mobile/app/_layout.tsx`

```tsx
import { StripeProvider } from "@stripe/stripe-react-native";

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {/* Existing providers */}
    </StripeProvider>
  );
}
```

### 2. Create Subscription Hook

**File**: `apps/mobile/hooks/useSubscription.ts`

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSubscriptionService } from "@workspace/supabase";
import { useSupabase } from "@/providers/SupabaseProvider";

export function useSubscription() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const subscriptionService = createSubscriptionService(supabase);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["user-subscription"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      return subscriptionService.getUserSubscription(user.id);
    },
  });

  const { data: tiers } = useQuery({
    queryKey: ["subscription-tiers"],
    queryFn: () => subscriptionService.getTiers(),
  });

  const hasExclusiveAccess =
    subscription?.tier?.features?.exclusive_rooms === true;
  const isPremium =
    hasExclusiveAccess &&
    ["active", "trialing"].includes(subscription?.status || "");

  return {
    subscription,
    tiers,
    isLoading,
    isPremium,
    hasExclusiveAccess,
  };
}
```

### 3. Create Checkout Hook

**File**: `apps/mobile/hooks/useCheckout.ts`

```tsx
import { useMutation } from "@tanstack/react-query";
import { useStripe } from "@stripe/stripe-react-native";
import { createSubscriptionService } from "@workspace/supabase";
import { useSupabase } from "@/providers/SupabaseProvider";
import { Alert } from "react-native";

export function useCheckout() {
  const supabase = useSupabase();
  const stripe = useStripe();
  const subscriptionService = createSubscriptionService(supabase);

  const checkoutMutation = useMutation({
    mutationFn: async (tierId: string) => {
      // Create checkout session
      const session = await subscriptionService.createCheckoutSession({
        tier_id: tierId,
        success_url: "myapp://subscription/success",
        cancel_url: "myapp://subscription/cancel",
      });

      // Open Stripe checkout (web view)
      // For React Native, you'll use Linking to open the URL
      const { error } = await stripe.createPaymentMethod({
        paymentMethodType: "Card",
      });

      if (error) {
        throw new Error(error.message);
      }

      return session;
    },
    onSuccess: () => {
      Alert.alert("Success", "Subscription activated!");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message);
    },
  });

  return {
    startCheckout: checkoutMutation.mutate,
    isLoading: checkoutMutation.isPending,
  };
}
```

### 4. Create Subscription Screen

**File**: `apps/mobile/app/(app)/subscription.tsx`

```tsx
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSubscription } from "@/hooks/useSubscription";
import { useCheckout } from "@/hooks/useCheckout";
import { Ionicons } from "@expo/vector-icons";

export default function SubscriptionScreen() {
  const { subscription, tiers, isLoading, isPremium } = useSubscription();
  const { startCheckout, isLoading: isCheckingOut } = useCheckout();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const premiumTier = tiers?.find((t) => t.name === "premium");

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {/* Current Plan */}
      <View className="bg-white rounded-lg p-6 mb-4">
        <Text className="text-lg font-semibold mb-2">Current Plan</Text>
        <Text className="text-2xl font-bold text-blue-600">
          {isPremium ? "Premium" : "Free"}
        </Text>
        {isPremium && subscription?.current_period_end && (
          <Text className="text-gray-600 mt-2">
            Renews on{" "}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Premium Features */}
      {!isPremium && premiumTier && (
        <>
          <View className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 mb-4">
            <Text className="text-white text-2xl font-bold mb-2">
              Go Premium
            </Text>
            <Text className="text-white text-4xl font-bold mb-4">
              ${premiumTier.price_monthly}/month
            </Text>

            <View className="space-y-3">
              <FeatureItem text="Access to exclusive premium rooms" />
              <FeatureItem text="Priority booking" />
              <FeatureItem text="Up to 10 concurrent bookings" />
              <FeatureItem text="Premium support" />
            </View>

            <Pressable
              onPress={() => startCheckout(premiumTier.id)}
              disabled={isCheckingOut}
              className="bg-white rounded-lg py-4 mt-6 items-center"
            >
              {isCheckingOut ? (
                <ActivityIndicator />
              ) : (
                <Text className="text-blue-600 font-bold text-lg">
                  Upgrade to Premium
                </Text>
              )}
            </Pressable>
          </View>
        </>
      )}

      {/* Manage Subscription (if premium) */}
      {isPremium && (
        <Pressable className="bg-white rounded-lg p-4 items-center">
          <Text className="text-blue-600 font-semibold">
            Manage Subscription
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name="checkmark-circle" size={24} color="white" />
      <Text className="text-white ml-2">{text}</Text>
    </View>
  );
}
```

### 5. Create Subscription Banner

**File**: `apps/mobile/components/SubscriptionBanner.tsx`

```tsx
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSubscription } from "@/hooks/useSubscription";
import { Ionicons } from "@expo/vector-icons";

export function SubscriptionBanner() {
  const { isPremium } = useSubscription();
  const router = useRouter();

  if (isPremium) return null;

  return (
    <Pressable
      onPress={() => router.push("/(app)/subscription")}
      className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 m-4 rounded-lg flex-row items-center"
    >
      <Ionicons name="star" size={24} color="white" />
      <View className="ml-3 flex-1">
        <Text className="text-white font-bold">Unlock Premium Rooms</Text>
        <Text className="text-white text-sm">
          Get access to exclusive spaces
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="white" />
    </Pressable>
  );
}
```

### 6. Update Room List to Show Exclusive Rooms

**File**: `apps/mobile/app/(tabs)/rooms.tsx`

Add this logic to your existing rooms list:

```tsx
import { useSubscription } from "@/hooks/useSubscription";
import { Ionicons } from "@expo/vector-icons";

// In your RoomCard component:
function RoomCard({ room }: { room: Room }) {
  const { isPremium } = useSubscription();
  const router = useRouter();
  const isLocked = room.is_exclusive && !isPremium;

  return (
    <Pressable
      onPress={() => {
        if (isLocked) {
          router.push("/(app)/subscription");
        } else {
          router.push(`/(app)/rooms/${room.id}`);
        }
      }}
      className={`bg-white rounded-lg p-4 mb-3 ${isLocked ? "opacity-75" : ""}`}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold">{room.name}</Text>
            {room.is_exclusive && (
              <View className="ml-2 bg-purple-100 px-2 py-1 rounded flex-row items-center">
                <Ionicons name="star" size={12} color="#7c3aed" />
                <Text className="text-purple-700 text-xs ml-1">Premium</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-600 mt-1">{room.description}</Text>
        </View>
        {isLocked && <Ionicons name="lock-closed" size={24} color="#9ca3af" />}
      </View>
    </Pressable>
  );
}
```

---

## 🔲 Web Admin Dashboard Implementation (Phase 6)

### 1. Update Room Form with Exclusive Checkbox

**File**: `apps/web/app/(dashboard)/rooms/components/RoomForm.tsx`

Add this field to your existing form:

```tsx
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

// In your form:
<FormField
  control={form.control}
  name="is_exclusive"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
      <FormControl>
        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Premium Exclusive Room</FormLabel>
        <FormDescription>
          Only users with an active premium subscription can book this room
        </FormDescription>
      </div>
    </FormItem>
  )}
/>;
```

### 2. Create Admin Subscriptions Dashboard

**File**: `apps/web/app/(dashboard)/subscriptions/page.tsx`

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { createSubscriptionService } from "@workspace/supabase";
import { useSupabase } from "@/providers/SupabaseProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionsPage() {
  const supabase = useSupabase();
  const subscriptionService = createSubscriptionService(supabase);

  const { data: stats } = useQuery({
    queryKey: ["subscription-stats"],
    queryFn: () => subscriptionService.getSubscriptionStats(),
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["all-subscriptions"],
    queryFn: () => subscriptionService.getAllSubscriptions(1, 50),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-gray-600">
          Manage user subscriptions and view statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Subscriptions</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.active_subscriptions || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Premium Users</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.premium_subscriptions || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Revenue (MRR)</CardDescription>
            <CardTitle className="text-3xl">
              ${stats?.mrr.toFixed(2) || "0.00"}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Churn Rate</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.churn_rate.toFixed(1) || "0.0"}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead>Stripe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions?.data.map((sub: any) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sub.user?.full_name}</div>
                      <div className="text-sm text-gray-500">
                        {sub.user?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{sub.tier?.display_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sub.status === "active" ? "default" : "secondary"
                      }
                    >
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {sub.stripe_customer_id && (
                      <a
                        href={`https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔲 Stripe Configuration (Phase 7)

### 1. Create Stripe Account and Products

1. **Sign up**: https://dashboard.stripe.com/register
2. **Create Products**:
   - Go to Products → Add Product
   - Name: "Premium Subscription"
   - Price: $9.99/month (recurring)
   - Copy the Price ID (starts with `price_...`)

3. **Get API Keys**:
   - Go to Developers → API keys
   - Copy **Publishable key** and **Secret key**

### 2. Set Environment Variables

**Supabase Secrets** (for Edge Functions):

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PREMIUM_PRICE_ID=price_...
```

**Mobile App** (`apps/mobile/.env`):

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Web App** (`apps/web/.env.local`):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Update Database with Stripe Price ID

```sql
UPDATE subscription_tiers
SET stripe_price_id = 'price_1234abcd...'
WHERE name = 'premium';
```

### 4. Configure Stripe Webhooks

1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhooks`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (`whsec_...`) and add it to Supabase secrets

---

## Testing Checklist

### Database & RLS Testing

- [ ] New users automatically get free tier subscription
- [ ] Free users can view exclusive rooms but cannot book them
- [ ] Premium users can book exclusive rooms
- [ ] RLS prevents unauthorized booking of exclusive rooms

### Payment Flow Testing

Use Stripe test cards:

- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

- [ ] User can complete checkout flow
- [ ] Webhook updates subscription status
- [ ] User immediately gains exclusive access after payment
- [ ] Subscription shows correct expiry date
- [ ] User can manage subscription via billing portal
- [ ] Cancelled subscriptions revert to free tier
- [ ] Failed payments mark subscription as past_due

### UI Testing

**Mobile:**

- [ ] Subscription banner appears for free users
- [ ] Exclusive rooms show lock icon
- [ ] Tapping locked room redirects to subscription page
- [ ] Subscription screen shows correct plan and pricing
- [ ] Premium users see "Manage Subscription" option

**Web:**

- [ ] Room form has exclusive checkbox
- [ ] Exclusive rooms display premium badge
- [ ] Subscriptions dashboard shows correct stats
- [ ] Admin can view all user subscriptions

---

## Deployment

### 1. Apply Database Migrations

```bash
# Production
supabase db push
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy stripe-webhooks
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
```

### 3. Set Production Stripe Keys

Replace test keys (`pk_test_`, `sk_test_`) with live keys (`pk_live_`, `sk_live_`)

### 4. Configure Production Webhook

Update Stripe webhook endpoint URL to production Supabase project

### 5. Deploy Apps

```bash
# Web (Vercel)
cd apps/web
vercel --prod

# Mobile (EAS)
cd apps/mobile
eas build --platform ios
eas build --platform android
```

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check Supabase Edge Function logs: `supabase functions logs stripe-webhooks`
2. Verify webhook signature secret matches
3. Test webhook manually from Stripe dashboard

### Payment Not Activating Subscription

1. Check `subscription_events` table for error logs
2. Verify `stripe_price_id` matches in database and Stripe
3. Check Edge Function logs for errors

### RLS Blocking Access

1. Test helper function: `SELECT user_has_exclusive_access('user-uuid');`
2. Verify subscription status is 'active' or 'trialing'
3. Check `current_period_end` is in the future

---

## Support

For issues or questions:

- Check Stripe dashboard for payment issues
- Check Supabase logs for database/function errors
- Review RLS policies if access control fails

## Next Steps

1. Implement remaining UI components (subscription screen, banner, room badges)
2. Test payment flow end-to-end with Stripe test mode
3. Configure production Stripe keys and webhooks
4. Deploy to production
5. Monitor subscription metrics and user feedback
