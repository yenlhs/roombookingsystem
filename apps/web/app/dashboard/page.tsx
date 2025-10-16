'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, DoorOpen, Calendar, Users, User } from 'lucide-react';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Room Booking System</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Welcome to your Dashboard</h2>
          <p className="text-muted-foreground">
            You&apos;ve successfully logged in!
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/rooms">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <DoorOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Rooms</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage meeting rooms and spaces
                </p>
                <div className="mt-4 flex items-center text-sm font-semibold text-blue-600">
                  Manage Rooms
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/bookings">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Bookings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage room bookings
                </p>
                <div className="mt-4 flex items-center text-sm font-semibold text-green-600">
                  Manage Bookings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Users</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage user accounts and permissions
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                (Coming in Phase 4)
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              ✅ Phase 1 Complete: Foundation & Infrastructure
            </p>
            <p className="mt-1 text-xs text-green-700">
              Authentication & Profile Management fully functional!
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              ✅ Phase 2 Complete: Room Management
            </p>
            <p className="mt-1 text-xs text-green-700">
              Full room management available on web and mobile!
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800">
              🚀 Phase 3 Complete: Booking System
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Full booking management is now available. Users can book rooms on mobile, and admins can manage all bookings on web!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
