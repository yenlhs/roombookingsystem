"use client";

import { useState } from "react";
import { AdminRoute } from "../../../../components/admin/AdminRoute";
import { SubscriptionTable } from "../../../../components/subscriptions/SubscriptionTable";
import { useSubscriptions } from "../../../../lib/hooks/use-subscriptions";
import { SubscriptionStatus } from "@workspace/types";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function UserSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus[]>([]);
  const [searchInput, setSearchInput] = useState("");

  const { subscriptions, total, totalPages, isLoading } = useSubscriptions({
    page,
    perPage: 20,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    search: search || undefined,
  });

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
    <AdminRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/subscriptions"
              className="text-sm text-primary hover:text-primary/80 mb-2 inline-flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Subscriptions
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              User Subscriptions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and view all user subscriptions
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by user name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 whitespace-nowrap"
            >
              <Filter className="h-5 w-5" />
              Filters
              {(statusFilter.length > 0 || search) && (
                <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5">
                  {statusFilter.length + (search ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 py-1">
              Status:
            </span>
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter.includes(status)
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {status.charAt(0).toUpperCase() +
                  status.slice(1).replace("_", " ")}
              </button>
            ))}
            {(statusFilter.length > 0 || search) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            Showing {subscriptions.length} of {total} subscriptions
          </div>
          <div>
            Page {page} of {totalPages || 1}
          </div>
        </div>

        {/* Table */}
        <SubscriptionTable
          subscriptions={subscriptions}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </AdminRoute>
  );
}
