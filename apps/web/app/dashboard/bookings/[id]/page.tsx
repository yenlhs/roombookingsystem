'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useAuth } from '@/lib/auth/context';
import { createBookingService, supabase } from '@workspace/supabase';
import type { BookingWithDetails } from '@workspace/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function BookingDetailsPage() {
  return (
    <ProtectedRoute>
      <BookingDetailsContent />
    </ProtectedRoute>
  );
}

function BookingDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);

  const bookingService = createBookingService(supabase);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.getBookingById(bookingId);
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingService.cancelBooking({ id: bookingId });
      await loadBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const handleDeleteBooking = async () => {
    if (
      !confirm(
        'Are you sure you want to permanently delete this booking? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await bookingService.deleteBooking(bookingId);
      router.push('/dashboard/bookings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete booking');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.confirmed;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">Booking not found</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/bookings')}>
            Back to Bookings
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
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/bookings')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Booking Details</h1>
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
      <div className="container mx-auto max-w-4xl p-8">
        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Booking Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{booking.room?.name || 'Unknown Room'}</CardTitle>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(booking.status)}`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {booking.status === 'confirmed' && (
                  <>
                    <Link href={`/dashboard/bookings/${bookingId}/edit`}>
                      <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={handleCancelBooking}>
                      Cancel Booking
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={handleDeleteBooking}>
                  <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Info Grid */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Date</span>
                </div>
                <p className="mt-1 text-base font-medium">{formatDate(booking.booking_date)}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Time</span>
                </div>
                <p className="mt-1 text-base font-medium">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Room</span>
                </div>
                <p className="mt-1 text-base font-medium">{booking.room?.name}</p>
                {booking.room?.capacity && (
                  <p className="text-sm text-muted-foreground">Capacity: {booking.room.capacity} people</p>
                )}
              </div>

              {booking.notes && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Notes</span>
                  </div>
                  <p className="mt-1 text-sm">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Booked By</span>
                </div>
                <p className="mt-1 text-base font-medium">{booking.user?.full_name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{booking.user?.email}</p>
              </div>

              <div>
                <div className="text-sm font-semibold text-muted-foreground">Booking ID</div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{booking.id}</p>
              </div>

              <div>
                <div className="text-sm font-semibold text-muted-foreground">Created At</div>
                <p className="mt-1 text-sm">
                  {new Date(booking.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cancellation Info (if cancelled) */}
        {booking.status === 'cancelled' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Cancellation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.cancelled_at && (
                <div>
                  <div className="text-sm font-semibold text-red-800">Cancelled At</div>
                  <p className="text-sm text-red-900">
                    {new Date(booking.cancelled_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {booking.cancellation_reason && (
                <div>
                  <div className="text-sm font-semibold text-red-800">Reason</div>
                  <p className="text-sm text-red-900">{booking.cancellation_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
