"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/lib/auth/protected-route";
import { useAuth } from "@/lib/auth/context";
import {
  createBookingService,
  createRoomService,
  supabase,
} from "@workspace/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateBookingSchema,
  type UpdateBookingInput,
} from "@workspace/validation";
import type { BookingWithDetails, Room } from "@workspace/types";
import { RoomStatus } from "@workspace/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft } from "lucide-react";

export default function EditBookingPage() {
  return (
    <ProtectedRoute>
      <EditBookingContent />
    </ProtectedRoute>
  );
}

function EditBookingContent() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const { user: currentUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  const bookingService = createBookingService(supabase);
  const roomService = createRoomService(supabase);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBookingInput>({
    resolver: zodResolver(updateBookingSchema),
  });

  useEffect(() => {
    loadData();
  }, [bookingId]);

  const loadData = async () => {
    try {
      setLoadingBooking(true);
      setError(null);
      const [bookingData, roomsData] = await Promise.all([
        bookingService.getBookingById(bookingId),
        roomService.getRooms({ status: RoomStatus.ACTIVE }),
      ]);
      setBooking(bookingData);
      setRooms(roomsData);

      // Pre-populate form with existing data
      reset({
        id: bookingData.id,
        room_id: bookingData.room_id,
        booking_date: bookingData.booking_date,
        start_time: bookingData.start_time.slice(0, 5), // HH:mm format
        end_time: bookingData.end_time.slice(0, 5),
        notes: bookingData.notes || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking");
    } finally {
      setLoadingBooking(false);
    }
  };

  const onSubmit = async (data: UpdateBookingInput) => {
    try {
      setLoading(true);
      setError(null);

      await bookingService.updateBooking(data);
      router.push(`/dashboard/bookings/${bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  const generateDateOptions = (): string[] => {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }

    return dates;
  };

  if (loadingBooking) {
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
          <p className="text-muted-foreground">Booking not found</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/bookings")}
          >
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/bookings/${bookingId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Edit Booking</h1>
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
      <div className="container mx-auto max-w-2xl p-8">
        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Edit Booking Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update the booking details below. Changes will update the
              reservation.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Hidden ID field */}
              <input type="hidden" {...register("id")} value={bookingId} />

              {/* User Info (Read-only) */}
              <div className="space-y-2">
                <Label>User</Label>
                <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm">
                  {booking.user?.full_name} ({booking.user?.email})
                </div>
                <p className="text-xs text-muted-foreground">
                  User cannot be changed for existing bookings
                </p>
              </div>

              {/* Room Selection */}
              <div className="space-y-2">
                <Label htmlFor="room_id">Room</Label>
                <select
                  id="room_id"
                  {...register("room_id")}
                  disabled={loading}
                  className={`flex h-10 w-full rounded-md border ${
                    errors.room_id ? "border-red-500" : "border-input"
                  } bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                      {room.capacity && ` (Capacity: ${room.capacity})`}
                    </option>
                  ))}
                </select>
                {errors.room_id && (
                  <p className="text-sm text-red-600">
                    {errors.room_id.message}
                  </p>
                )}
              </div>

              {/* Booking Date */}
              <div className="space-y-2">
                <Label htmlFor="booking_date">Date</Label>
                <select
                  id="booking_date"
                  {...register("booking_date")}
                  disabled={loading}
                  className={`flex h-10 w-full rounded-md border ${
                    errors.booking_date ? "border-red-500" : "border-input"
                  } bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {generateDateOptions().map((date) => {
                    const dateObj = new Date(date);
                    const display = dateObj.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    return (
                      <option key={date} value={date}>
                        {display}
                      </option>
                    );
                  })}
                </select>
                {errors.booking_date && (
                  <p className="text-sm text-red-600">
                    {errors.booking_date.message}
                  </p>
                )}
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  {...register("start_time")}
                  disabled={loading}
                  className={errors.start_time ? "border-red-500" : ""}
                />
                {errors.start_time && (
                  <p className="text-sm text-red-600">
                    {errors.start_time.message}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  {...register("end_time")}
                  disabled={loading}
                  className={errors.end_time ? "border-red-500" : ""}
                />
                {errors.end_time && (
                  <p className="text-sm text-red-600">
                    {errors.end_time.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Add any special requirements or notes..."
                  disabled={loading}
                  rows={3}
                  maxLength={500}
                  className={`flex w-full rounded-md border ${
                    errors.notes ? "border-red-500" : "border-input"
                  } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`}
                />
                {errors.notes && (
                  <p className="text-sm text-red-600">{errors.notes.message}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/bookings/${bookingId}`)
                  }
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Warning Card */}
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-yellow-600">⚠️</div>
              <div>
                <p className="text-sm font-semibold text-yellow-900">
                  Editing Active Booking
                </p>
                <p className="mt-1 text-sm text-yellow-800">
                  Changes to the date or time will check for conflicts with
                  existing bookings. The system will prevent overlapping
                  reservations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
