'use client';

import { AdminRoute } from '../../../components/admin/AdminRoute';
import { SubscriptionStatsCards } from '../../../components/subscriptions/SubscriptionStatsCards';
import Link from 'next/link';
import { Users, CreditCard, FileText, BarChart3 } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function QuickActionCard({ title, description, href, icon }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default function SubscriptionsPage() {
  return (
    <AdminRoute>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Subscription Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage user subscriptions, tiers, and view analytics
          </p>
        </div>

        {/* Stats Cards */}
        <SubscriptionStatsCards />

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title="User Subscriptions"
              description="View and manage all user subscriptions"
              href="/dashboard/subscriptions/users"
              icon={<Users className="h-5 w-5" />}
            />
            <QuickActionCard
              title="Subscription Tiers"
              description="Configure subscription tiers and pricing"
              href="/dashboard/subscriptions/tiers"
              icon={<CreditCard className="h-5 w-5" />}
            />
            <QuickActionCard
              title="Event Logs"
              description="View subscription event audit trail"
              href="/dashboard/subscriptions/events"
              icon={<FileText className="h-5 w-5" />}
            />
            <QuickActionCard
              title="Reports"
              description="Generate subscription reports and analytics"
              href="/dashboard/subscriptions/reports"
              icon={<BarChart3 className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Admin Access
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                You have admin access to manage all subscriptions. All actions are logged for
                compliance and audit purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
