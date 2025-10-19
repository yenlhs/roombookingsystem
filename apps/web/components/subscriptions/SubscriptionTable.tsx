import Link from "next/link";
import { UserSubscriptionWithTier } from "@workspace/types";
import { StatusBadge } from "./StatusBadge";
import { ExternalLink, Eye } from "lucide-react";
import { format } from "date-fns";

// Extended type with joined user data from admin queries
interface UserSubscriptionWithUserAndTier extends UserSubscriptionWithTier {
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface SubscriptionTableProps {
  subscriptions: UserSubscriptionWithUserAndTier[];
  isLoading?: boolean;
}

export function SubscriptionTable({
  subscriptions,
  isLoading,
}: SubscriptionTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Period End
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No subscriptions found
        </p>
      </div>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? "-" : format(date, "MMM d, yyyy");
  };

  const getStripeCustomerUrl = (stripeCustomerId?: string | null) => {
    if (!stripeCustomerId) return null;
    const baseUrl =
      process.env.NEXT_PUBLIC_STRIPE_MODE === "live"
        ? "https://dashboard.stripe.com"
        : "https://dashboard.stripe.com/test";
    return `${baseUrl}/customers/${stripeCustomerId}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Period End
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stripe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {subscriptions.map((subscription) => (
              <tr
                key={subscription.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {subscription.user?.avatar_url ? (
                      <img
                        src={subscription.user.avatar_url}
                        alt={subscription.user.full_name || "User avatar"}
                        className="h-8 w-8 rounded-full mr-3"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {subscription.user?.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {subscription.user?.full_name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {subscription.user?.email || "-"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {subscription.tier && (
                    <StatusBadge status={subscription.tier.name} type="tier" />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge
                    status={subscription.status}
                    type="subscription"
                  />
                  {subscription.cancel_at_period_end && (
                    <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                      (Cancelling)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(subscription.current_period_end)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {subscription.stripe_customer_id ? (
                    <a
                      href={
                        getStripeCustomerUrl(subscription.stripe_customer_id) ||
                        "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/dashboard/subscriptions/users/${subscription.id}`}
                    className="text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
