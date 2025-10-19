"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/lib/auth/protected-route";
import { useAuth } from "@/lib/auth/context";
import { createBookingService, supabase } from "@workspace/supabase";
import type { User, BookingWithDetails, Database } from "@workspace/types";
import { UserStatus } from "@workspace/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User as UserIcon,
  AlertCircle,
  UserCheck,
  UserX,
  Activity,
} from "lucide-react";

export default function UserDetailsPage() {
  return (
    <ProtectedRoute>
      <UserDetailsContent />
    </ProtectedRoute>
  );
}

function UserDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });

  const bookingService = createBookingService(supabase);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Load user's bookings
      const userBookings = await bookingService.getBookings({
        user_id: userId,
      });
      setBookings(userBookings);

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      setBookingStats({
        total: userBookings.length,
        upcoming: userBookings.filter(
          (b) => b.status === "confirmed" && b.booking_date >= today,
        ).length,
        completed: userBookings.filter((b) => b.status === "completed").length,
        cancelled: userBookings.filter((b) => b.status === "cancelled").length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    const newStatus =
      user.status === UserStatus.ACTIVE
        ? UserStatus.INACTIVE
        : UserStatus.ACTIVE;
    const action = newStatus === UserStatus.ACTIVE ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      const updateData: Database["public"]["Tables"]["users"]["Update"] = {
        status: newStatus,
      };
      const { error: updateError } = await supabase
        .from("users")
        // @ts-expect-error - Supabase type inference issue with update method
        .update(updateData)
        .eq("id", userId);

      if (updateError) throw updateError;

      await loadUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} user`);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: UserStatus) => {
    return status === UserStatus.ACTIVE
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-800";
  };

  const getRoleBadge = (role: string) => {
    return role === "admin"
      ? "bg-purple-100 text-purple-800"
      : "bg-blue-100 text-blue-800";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">User not found</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/users")}
          >
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/users")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">User Details</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {currentUser?.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto max-w-6xl p-8">
        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* User Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{user.full_name}</CardTitle>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(user.status)}`}
                  >
                    {user.status}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getRoleBadge(user.role)}`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
              {user.id !== currentUser?.id && (
                <Button variant="outline" onClick={handleToggleStatus}>
                  {user.status === UserStatus.ACTIVE ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Deactivate User
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate User
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Main Info Grid */}
        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          {/* User Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span>Full Name</span>
                </div>
                <p className="mt-1 text-base font-medium">{user.full_name}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <p className="mt-1 text-base font-medium">{user.email}</p>
              </div>

              {user.phone && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </div>
                  <p className="mt-1 text-base font-medium">{user.phone}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined</span>
                </div>
                <p className="mt-1 text-base font-medium">
                  {formatDate(user.created_at)}
                </p>
              </div>

              <div>
                <div className="text-sm font-semibold text-muted-foreground">
                  User ID
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {user.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Total Bookings</span>
                </div>
                <p className="mt-1 text-2xl font-bold">{bookingStats.total}</p>
              </div>

              <div>
                <div className="text-sm font-semibold text-muted-foreground">
                  Upcoming
                </div>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {bookingStats.upcoming}
                </p>
              </div>

              <div>
                <div className="text-sm font-semibold text-muted-foreground">
                  Completed
                </div>
                <p className="mt-1 text-xl font-bold text-gray-600">
                  {bookingStats.completed}
                </p>
              </div>

              <div>
                <div className="text-sm font-semibold text-muted-foreground">
                  Cancelled
                </div>
                <p className="mt-1 text-xl font-bold text-red-600">
                  {bookingStats.cancelled}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No bookings found
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 10).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{booking.room?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(booking.booking_date)} •{" "}
                        {formatTime(booking.start_time)} -{" "}
                        {formatTime(booking.end_time)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                      <Link href={`/dashboard/bookings/${booking.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {bookings.length > 10 && (
                  <div className="pt-3 text-center">
                    <Link href="/dashboard/bookings">
                      <Button variant="link">View All Bookings</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
