"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AdminRoute } from "../../../../../components/admin/AdminRoute";
import { StatusBadge } from "../../../../../components/subscriptions/StatusBadge";
import { supabase, createAdminSubscriptionService } from "@workspace/supabase";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ExternalLink,
  User,
  CreditCard,
  Calendar,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

// Extended type for subscription with joined user data
interface SubscriptionWithUser {
  id: string;
  user_id: string;
  tier_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  created_at: string;
  updated_at: string;
  tier: {
    name: string;
    display_name: string;
    price_monthly: number;
  };
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
  };
}

export default function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AdminRoute>
      <SubscriptionDetailContent params={params} />
    </AdminRoute>
  );
}

function SubscriptionDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, signOut } = useAuth();

  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery<SubscriptionWithUser>({
    queryKey: ["subscription-detail", id],
    queryFn: async () => {
      const service = createAdminSubscriptionService(supabase);
      return (await service.getSubscriptionByIdAdmin(
        id,
      )) as SubscriptionWithUser;
    },
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 1,
  });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "PPP p");
    } catch {
      return dateString;
    }
  };

  const getStripeUrl = (
    type: "customer" | "subscription",
    stripeId?: string | null,
  ) => {
    if (!stripeId) return null;
    const baseUrl =
      process.env.NEXT_PUBLIC_STRIPE_MODE === "live"
        ? "https://dashboard.stripe.com"
        : "https://dashboard.stripe.com/test";
    return type === "customer"
      ? `${baseUrl}/customers/${stripeId}`
      : `${baseUrl}/subscriptions/${stripeId}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/subscriptions/users")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Subscription Details</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto p-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard/subscriptions/users"
            className="text-sm text-primary hover:text-primary/80 mb-2 inline-flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Subscriptions
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="pt-6 animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-300">
              <h3 className="text-sm font-medium mb-1">
                Error loading subscription
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                {error instanceof Error
                  ? error.message
                  : "Unknown error occurred"}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Content */}
        {subscription && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* User Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <CardTitle className="text-lg">User Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {subscription.user?.avatar_url ? (
                      <Image
                        src={subscription.user.avatar_url}
                        alt={subscription.user?.full_name || "User avatar"}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
                          {subscription.user?.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {subscription.user?.full_name || "Unknown User"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {subscription.user?.email || "-"}
                      </div>
                    </div>
                  </div>
                  {subscription.user?.phone && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Phone:{" "}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {subscription.user.phone}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      User Since:{" "}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(subscription.user?.created_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <CardTitle className="text-lg">
                    Subscription Information
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Tier:{" "}
                    </span>
                    {subscription.tier && (
                      <>
                        <StatusBadge
                          status={subscription.tier.name}
                          type="tier"
                        />
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {subscription.tier.display_name}
                        </span>
                      </>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Status:{" "}
                    </span>
                    <StatusBadge
                      status={subscription.status}
                      type="subscription"
                    />
                    {subscription.cancel_at_period_end && (
                      <span className="ml-2 text-sm text-orange-600 dark:text-orange-400">
                        (Cancels at period end)
                      </span>
                    )}
                  </div>
                  {subscription.tier && subscription.tier.price_monthly > 0 && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Price:{" "}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${subscription.tier.price_monthly}/month
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Billing Periods */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <CardTitle className="text-lg">Billing Periods</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Period Start
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.current_period_start)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Period End
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.current_period_end)}
                    </div>
                  </div>
                  {subscription.cancelled_at && (
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Cancelled At
                      </div>
                      <div className="text-sm font-medium text-red-600 dark:text-red-400">
                        {formatDate(subscription.cancelled_at)}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Created At
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.created_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stripe Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <CardTitle className="text-lg">Stripe Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subscription.stripe_customer_id ? (
                    <>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Customer ID
                        </div>
                        <a
                          href={
                            getStripeUrl(
                              "customer",
                              subscription.stripe_customer_id,
                            ) || "#"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          {subscription.stripe_customer_id}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {subscription.stripe_subscription_id && (
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Subscription ID
                          </div>
                          <a
                            href={
                              getStripeUrl(
                                "subscription",
                                subscription.stripe_subscription_id,
                              ) || "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                          >
                            {subscription.stripe_subscription_id}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No Stripe information (possibly a complimentary
                      subscription)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
