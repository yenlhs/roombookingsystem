"use client";

import { useRouter } from "next/navigation";
import { AdminRoute } from "../../../components/admin/AdminRoute";
import { SubscriptionStatsCards } from "../../../components/subscriptions/SubscriptionStatsCards";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Users,
  CreditCard,
  FileText,
  BarChart3,
  ArrowLeft,
  Info,
} from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SubscriptionsPage() {
  return (
    <AdminRoute>
      <SubscriptionsContent />
    </AdminRoute>
  );
}

function SubscriptionsContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Subscription Management</h1>
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
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Subscriptions</h2>
          <p className="text-muted-foreground">
            Manage user subscriptions, tiers, and view analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6">
          <SubscriptionStatsCards />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
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
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Admin Access
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  You have admin access to manage all subscriptions. All actions
                  are logged for compliance and audit purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
