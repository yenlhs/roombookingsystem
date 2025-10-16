'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useAuth } from '@/lib/auth/context';
import { createBookingService, createRoomService, supabase } from '@workspace/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBookingSchema, type CreateBookingInput } from '@workspace/validation';
import type { Room, User, TimeSlot } from '@workspace/types';
import { RoomStatus } from '@workspace/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function NewBookingPage() {
  return (
    <ProtectedRoute>
      <NewBookingContent />
    </ProtectedRoute>
  );
}

function NewBookingContent() {
  const router = useRouter();
  const { user: currentUser, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const bookingService = createBookingService(supabase);
  const roomService = createRoomService(supabase);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
  });

  const watchedUserId = watch('user_id');
  const watchedRoomId = watch('room_id');
  const watchedDate = watch('booking_date');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (watchedRoomId && watchedDate) {
      loadAvailableSlots(watchedRoomId, watchedDate);
    }
  }, [watchedRoomId, watchedDate]);

  const loadInitialData = async () => {
    try {
      setLoadingRooms(true);
      const [roomsData, usersData] = await Promise.all([
        roomService.getRooms({ status: RoomStatus.ACTIVE }),
        loadUsers(),
      ]);
      setRooms(roomsData);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'active')
      .order('full_name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  };

  const loadAvailableSlots = async (roomId: string, date: string) => {
    try {
      setLoadingSlots(true);
      const availability = await bookingService.getRoomAvailability(roomId, date);
      setAvailableSlots(availability.slots.filter((slot) => slot.is_available));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load available slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const onSubmit = async (data: CreateBookingInput) => {
    try {
      setLoading(true);
      setError(null);

      await bookingService.createBooking(data);
      router.push('/dashboard/bookings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const generateDateOptions = (): string[] => {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  if (loadingRooms) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            <h1 className="text-xl font-bold">Create New Booking</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{currentUser?.email}</span>
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
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* User Selection */}
              <div className="space-y-2">
                <Label htmlFor="user_id">
                  User <span className="text-red-500">*</span>
                </Label>
                <select
                  id="user_id"
                  {...register('user_id')}
                  disabled={loading}
                  className={`flex h-10 w-full rounded-md border ${
                    errors.user_id ? 'border-red-500' : 'border-input'
                  } bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
                {errors.user_id && (
                  <p className="text-sm text-red-600">{errors.user_id.message}</p>
                )}
              </div>

              {/* Room Selection */}
              <div className="space-y-2">
                <Label htmlFor="room_id">
                  Room <span className="text-red-500">*</span>
                </Label>
                <select
                  id="room_id"
                  {...register('room_id')}
                  disabled={loading}
                  className={`flex h-10 w-full rounded-md border ${
                    errors.room_id ? 'border-red-500' : 'border-input'
                  } bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="">Select a room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                      {room.capacity && ` (Capacity: ${room.capacity})`}
                    </option>
                  ))}
                </select>
                {errors.room_id && (
                  <p className="text-sm text-red-600">{errors.room_id.message}</p>
                )}
              </div>

              {/* Booking Date */}
              <div className="space-y-2">
                <Label htmlFor="booking_date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <select
                  id="booking_date"
                  {...register('booking_date')}
                  disabled={loading}
                  className={`flex h-10 w-full rounded-md border ${
                    errors.booking_date ? 'border-red-500' : 'border-input'
                  } bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <option value="">Select a date</option>
                  {generateDateOptions().map((date) => {
                    const dateObj = new Date(date);
                    const display = dateObj.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    return (
                      <option key={date} value={date}>
                        {display}
                      </option>
                    );
                  })}
                </select>
                {errors.booking_date && (
                  <p className="text-sm text-red-600">{errors.booking_date.message}</p>
                )}
              </div>

              {/* Available Slots */}
              {watchedRoomId && watchedDate && (
                <div className="rounded-lg border bg-slate-50 p-4">
                  <h3 className="mb-3 font-semibold">Available Time Slots</h3>
                  {loadingSlots ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {availableSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="rounded border bg-white p-2 text-center text-sm"
                        >
                          <Clock className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No available slots for this date. Please select a different date.
                    </p>
                  )}
                </div>
              )}

              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="start_time">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  {...register('start_time')}
                  disabled={loading}
                  className={errors.start_time ? 'border-red-500' : ''}
                />
                {errors.start_time && (
                  <p className="text-sm text-red-600">{errors.start_time.message}</p>
                )}
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="end_time">
                  End Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  {...register('end_time')}
                  disabled={loading}
                  className={errors.end_time ? 'border-red-500' : ''}
                />
                {errors.end_time && (
                  <p className="text-sm text-red-600">{errors.end_time.message}</p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Add any special requirements or notes..."
                  disabled={loading}
                  rows={3}
                  maxLength={500}
                  className={`flex w-full rounded-md border ${
                    errors.notes ? 'border-red-500' : 'border-input'
                  } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`}
                />
                {errors.notes && <p className="text-sm text-red-600">{errors.notes.message}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/bookings')}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Booking'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
