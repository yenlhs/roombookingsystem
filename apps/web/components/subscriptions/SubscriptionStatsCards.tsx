import { Users, TrendingUp, CreditCard, Activity } from 'lucide-react';
import { useSubscriptionStats } from '../../lib/hooks/use-subscription-stats';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
}

function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
          {trend && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {trend}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionStatsCards() {
  const { stats, isLoading, error } = useSubscriptionStats();

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p>Failed to load subscription statistics</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Subscriptions"
        value={stats?.total_subscriptions || 0}
        icon={<Users className="h-6 w-6" />}
        description="All user subscriptions"
      />
      <StatCard
        title="Active Subscriptions"
        value={stats?.active_subscriptions || 0}
        icon={<Activity className="h-6 w-6" />}
        description="Currently active"
      />
      <StatCard
        title="Premium Users"
        value={stats?.premium_subscriptions || 0}
        icon={<CreditCard className="h-6 w-6" />}
        description="Paying customers"
      />
      <StatCard
        title="Monthly Revenue"
        value={formatCurrency(stats?.mrr || 0)}
        icon={<TrendingUp className="h-6 w-6" />}
        description="MRR"
      />
    </div>
  );
}
