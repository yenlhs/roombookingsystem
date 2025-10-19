"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminRoute } from "../../../../components/admin/AdminRoute";
import { SubscriptionTable } from "../../../../components/subscriptions/SubscriptionTable";
import { useSubscriptions } from "../../../../lib/hooks/use-subscriptions";
import { useAuth } from "@/lib/auth/context";
import { SubscriptionStatus } from "@workspace/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UserSubscriptionsPage() {
  return (
    <AdminRoute>
      <UserSubscriptionsContent />
    </AdminRoute>
  );
}

function UserSubscriptionsContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus[]>([]);
  const [searchInput, setSearchInput] = useState("");

  const { subscriptions, total, totalPages, isLoading, error } =
    useSubscriptions({
      page,
      perPage: 20,
      status: statusFilter.length > 0 ? statusFilter : undefined,
      search: search || undefined,
    });

  // Clamp page when filters change total pages
  useEffect(() => {
    if (totalPages && page > totalPages) {
      setPage(Math.max(1, totalPages));
    }
  }, [totalPages, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1); // Reset to first page on search
  };

  const handleStatusFilterChange = (status: SubscriptionStatus) => {
    setStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
    setPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const statusOptions: SubscriptionStatus[] = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.TRIALING,
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/subscriptions")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">User Subscriptions</h1>
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
          <Link
            href="/dashboard/subscriptions"
            className="text-sm text-primary hover:text-primary/80 mb-2 inline-flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Subscriptions
          </Link>
          <h2 className="text-3xl font-bold mt-2">User Subscriptions</h2>
          <p className="text-muted-foreground">
            Manage and view all user subscriptions
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <Label htmlFor="subscription-search" className="sr-only">
                  Search subscriptions
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="subscription-search"
                    type="text"
                    placeholder="Search by user name or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium py-1">Status:</span>
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  onClick={() => handleStatusFilterChange(status)}
                  variant={
                    statusFilter.includes(status) ? "default" : "outline"
                  }
                  size="sm"
                  className="rounded-full"
                >
                  {status.charAt(0).toUpperCase() +
                    status.slice(1).replace("_", " ")}
                </Button>
              ))}
              {(statusFilter.length > 0 || search) && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Clear all
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {(error as Error).message || "Failed to load subscriptions."}
            </AlertDescription>
          </Alert>
        )}

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {subscriptions.length} of {total} subscriptions
          </div>
          <div>
            Page {page} of {totalPages || 1}
          </div>
        </div>

        {/* Table */}
        <div className="mb-6">
          <SubscriptionTable
            subscriptions={subscriptions}
            isLoading={isLoading}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="outline"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
