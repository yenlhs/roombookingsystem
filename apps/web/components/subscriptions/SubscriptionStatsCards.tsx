import { Users, TrendingUp, CreditCard, Activity } from "lucide-react";
import { useSubscriptionStats } from "../../lib/hooks/use-subscription-stats";
import { formatCurrency } from "@workspace/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  valueColor?: string;
}

function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  valueColor,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-2 ${valueColor || ""}`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
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
      </CardContent>
    </Card>
  );
}

export function SubscriptionStatsCards() {
  const { stats, isLoading, error } = useSubscriptionStats();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <CardContent className="pt-6">
          <p className="text-red-600 dark:text-red-400">
            Failed to load subscription statistics
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        valueColor="text-green-600"
      />
      <StatCard
        title="Premium Users"
        value={stats?.premium_subscriptions || 0}
        icon={<CreditCard className="h-6 w-6" />}
        description="Paying customers"
        valueColor="text-purple-600"
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
