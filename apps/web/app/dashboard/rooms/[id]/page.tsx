"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/lib/auth/protected-route";
import { useAuth } from "@/lib/auth/context";
import { createRoomService, supabase } from "@workspace/supabase";
import type { Room } from "@workspace/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Clock,
  Calendar,
  Activity,
  AlertCircle,
} from "lucide-react";

export default function RoomDetailsPage() {
  return (
    <ProtectedRoute>
      <RoomDetailsContent />
    </ProtectedRoute>
  );
}

function RoomDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [stats, setStats] = useState<{
    total_bookings: number;
    upcoming_bookings: number;
    utilization_rate: number;
  } | null>(null);

  const roomService = createRoomService(supabase);

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      setError(null);
      const [roomData, statsData] = await Promise.all([
        roomService.getRoomById(roomId),
        roomService.getRoomStats(roomId),
      ]);
      setRoom(roomData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this room? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await roomService.deleteRoom(roomId);
      router.push("/dashboard/rooms");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
    }
  };

  const handleToggleStatus = async () => {
    if (!room) return;

    try {
      if (room.status === "active") {
        await roomService.deactivateRoom(roomId);
      } else {
        await roomService.activateRoom(roomId);
      }
      await loadRoom();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update room status",
      );
    }
  };

  if (loading) {
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
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">Room not found</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/rooms")}
          >
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
              onClick={() => router.push("/dashboard/rooms")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Room Details</h1>
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
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Room Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{room.name}</CardTitle>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                      room.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {room.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/rooms/${roomId}/edit`}>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Info Grid */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          {/* Room Information */}
          <Card>
            <CardHeader>
              <CardTitle>Room Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {room.description && (
                <div>
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Description
                  </Label>
                  <p className="mt-1 text-sm">{room.description}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Capacity
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {room.capacity
                      ? `${room.capacity} people`
                      : "Not specified"}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Operating Hours
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {room.operating_hours_start.slice(0, 5)} -{" "}
                    {room.operating_hours_end.slice(0, 5)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Booking Slot Duration
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {room.slot_duration_minutes} minutes
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Created
                </Label>
                <p className="mt-1 text-sm">
                  {new Date(room.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Total Bookings
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {stats?.total_bookings || 0}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Upcoming Bookings
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {stats?.upcoming_bookings || 0}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground">
                  Status
                </Label>
                <div className="mt-2">
                  <Button
                    variant={room.status === "active" ? "outline" : "default"}
                    onClick={handleToggleStatus}
                    className="w-full"
                  >
                    {room.status === "active"
                      ? "Deactivate Room"
                      : "Activate Room"}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {room.status === "active"
                      ? "Room is available for bookings"
                      : "Room is hidden from users"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Amenities Section (if any) */}
        {room.amenities && Object.keys(room.amenities).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(room.amenities).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="font-semibold capitalize">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images Section (placeholder for future) */}
        {room.image_urls && room.image_urls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {room.image_urls.map((url, index) => (
                  <div
                    key={index}
                    className="aspect-video overflow-hidden rounded-lg border bg-muted"
                  >
                    <img
                      src={url}
                      alt={`${room.name} - Image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={`block ${className}`}>{children}</label>;
}
