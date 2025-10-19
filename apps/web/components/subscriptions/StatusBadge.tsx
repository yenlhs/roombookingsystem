import { SubscriptionStatus, SubscriptionTierName } from '@workspace/types';

interface StatusBadgeProps {
  status: SubscriptionStatus | SubscriptionTierName | string;
  type?: 'subscription' | 'tier';
}

const subscriptionStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  past_due: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  trialing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  incomplete: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  incomplete_expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const tierColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  cancelled: 'Cancelled',
  past_due: 'Past Due',
  trialing: 'Trialing',
  incomplete: 'Incomplete',
  incomplete_expired: 'Expired',
  unpaid: 'Unpaid',
  free: 'Free',
  premium: 'Premium',
};

export function StatusBadge({ status, type = 'subscription' }: StatusBadgeProps) {
  const colors = type === 'tier' ? tierColors : subscriptionStatusColors;
  const colorClass = colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  const label = statusLabels[status.toLowerCase()] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
