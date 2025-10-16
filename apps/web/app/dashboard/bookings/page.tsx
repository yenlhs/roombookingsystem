'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useAuth } from '@/lib/auth/context';
import { createBookingService, supabase } from '@workspace/supabase';
import type { BookingWithDetails, BookingStatus } from '@workspace/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Plus,
  Search,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  MapPin,
} from 'lucide-react';

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <BookingsContent />
    </ProtectedRoute>
  );
}

function BookingsContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const bookingService = createBookingService(supabase);

  useEffect(() => {
    loadBookings();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: Record<string, string> = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      const data = await bookingService.getBookings(filters);
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadBookings();
  };

  const handleCancelBooking = async (id: string, roomName: string) => {
    if (!confirm(`Are you sure you want to cancel this booking for ${roomName}?`)) {
      return;
    }

    try {
      await bookingService.cancelBooking({ id });
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const handleDeleteBooking = async (id: string, roomName: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete this booking for ${roomName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await bookingService.deleteBooking(id);
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete booking');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        booking.room?.name.toLowerCase().includes(query) ||
        booking.user?.full_name.toLowerCase().includes(query) ||
        booking.user?.email.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(booking.booking_date);
      bookingDate.setHours(0, 0, 0, 0);

      if (dateFilter === 'upcoming' && bookingDate < today) return false;
      if (dateFilter === 'past' && bookingDate >= today) return false;
    }

    return true;
  });

  const getStatusBadge = (status: BookingStatus) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || styles.confirmed;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Booking Management</h1>
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
        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Bookings</h2>
            <p className="text-muted-foreground">View and manage all room bookings</p>
          </div>
          <Link href="/dashboard/bookings/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
          </Link>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="md:col-span-2">
                <Label htmlFor="search" className="sr-only">
                  Search
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by room, user, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={handleSearch}>Search</Button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Label htmlFor="status" className="sr-only">
                  Status
                </Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as BookingStatus | 'all')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <Label htmlFor="dateFilter" className="sr-only">
                  Date Filter
                </Label>
                <select
                  id="dateFilter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as 'all' | 'upcoming' | 'past')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">All Dates</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'No bookings found matching your criteria.'
                  : 'No bookings created yet. Click "Create Booking" to get started.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Room & User Info */}
                      <div className="flex items-start gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold">{booking.room?.name || 'Unknown Room'}</h3>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{booking.user?.full_name || 'Unknown User'}</span>
                            <span className="text-xs">({booking.user?.email})</span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      {/* Date & Time Info */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(booking.booking_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </span>
                        </div>
                      </div>

                      {/* Notes */}
                      {booking.notes && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/dashboard/bookings/${booking.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {booking.status === 'confirmed' && (
                        <>
                          <Link href={`/dashboard/bookings/${booking.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCancelBooking(booking.id, booking.room?.name || 'this room')
                            }
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDeleteBooking(booking.id, booking.room?.name || 'this room')
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && filteredBookings.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {filteredBookings.length} of {bookings.length} booking
            {bookings.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
