'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useAuth } from '@/lib/auth/context';
import { createRoomService, supabase } from '@workspace/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateRoomSchema, type UpdateRoomInput } from '@workspace/validation';
import type { Room } from '@workspace/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function EditRoomPage() {
  return (
    <ProtectedRoute>
      <EditRoomContent />
    </ProtectedRoute>
  );
}

function EditRoomContent() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const roomService = createRoomService(supabase);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateRoomInput>({
    resolver: zodResolver(updateRoomSchema),
  });

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      setLoadingRoom(true);
      setError(null);
      const data = await roomService.getRoomById(roomId);
      setRoom(data);

      // Pre-populate form with existing data
      reset({
        id: data.id,
        name: data.name,
        description: data.description || '',
        capacity: data.capacity || undefined,
        status: data.status,
        operating_hours_start: data.operating_hours_start.slice(0, 5), // HH:mm format
        operating_hours_end: data.operating_hours_end.slice(0, 5),
        slot_duration_minutes: data.slot_duration_minutes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load room');
    } finally {
      setLoadingRoom(false);
    }
  };

  const onSubmit = async (data: UpdateRoomInput) => {
    try {
      setLoading(true);
      setError(null);

      await roomService.updateRoom(data);
      router.push(`/dashboard/rooms/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRoom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-muted-foreground">Room not found</p>
          <Button className="mt-4" onClick={() => router.push('/dashboard/rooms')}>
            Back to Rooms
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
              onClick={() => router.push(`/dashboard/rooms/${roomId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Edit Room</h1>
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
      <div className="container mx-auto max-w-2xl p-8">
        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Edit Room Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update the room details below. Changes will affect future bookings.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Hidden ID field */}
              <input type="hidden" {...register('id')} value={roomId} />

              {/* Room Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Room Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Conference Room A"
                  disabled={loading}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of the room"
                  disabled={loading}
                  rows={3}
                  className={`flex w-full rounded-md border ${
                    errors.description ? 'border-red-500' : 'border-input'
                  } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50`}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...register('capacity', { valueAsNumber: true })}
                  placeholder="e.g., 10"
                  disabled={loading}
                  className={errors.capacity ? 'border-red-500' : ''}
                />
                {errors.capacity && (
                  <p className="text-sm text-red-600">{errors.capacity.message}</p>
                )}
              </div>

              {/* Operating Hours */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operating_hours_start">Start Time</Label>
                  <Input
                    id="operating_hours_start"
                    type="time"
                    {...register('operating_hours_start')}
                    disabled={loading}
                    className={errors.operating_hours_start ? 'border-red-500' : ''}
                  />
                  {errors.operating_hours_start && (
                    <p className="text-sm text-red-600">
                      {errors.operating_hours_start.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operating_hours_end">End Time</Label>
                  <Input
                    id="operating_hours_end"
                    type="time"
                    {...register('operating_hours_end')}
                    disabled={loading}
                    className={errors.operating_hours_end ? 'border-red-500' : ''}
                  />
                  {errors.operating_hours_end && (
                    <p className="text-sm text-red-600">
                      {errors.operating_hours_end.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Slot Duration */}
              <div className="space-y-2">
                <Label htmlFor="slot_duration_minutes">
                  Booking Slot Duration (minutes)
                </Label>
                <select
                  id="slot_duration_minutes"
                  {...register('slot_duration_minutes', { valueAsNumber: true })}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
                {errors.slot_duration_minutes && (
                  <p className="text-sm text-red-600">
                    {errors.slot_duration_minutes.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Note: Changing this may affect existing bookings
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register('status')}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Inactive rooms won&apos;t be available for new bookings
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/rooms/${roomId}`)}
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
                    'Save Changes'
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
                  Editing Active Room
                </p>
                <p className="mt-1 text-sm text-yellow-800">
                  Changes to operating hours or slot duration may affect existing bookings.
                  Please review carefully before saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
