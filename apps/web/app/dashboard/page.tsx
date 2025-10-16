'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { useAuth } from '@/lib/auth/context';
import { createBookingService, createRoomService, supabase } from '@workspace/supabase';
import type { User as UserType } from '@workspace/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, DoorOpen, Calendar, Users, User, Activity, Loader2 } from 'lucide-react';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsButton } from '@/components/keyboard-shortcuts-dialog';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRooms: 0,
    activeRooms: 0,
    totalBookingsToday: 0,
    totalBookingsWeek: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [showShortcuts, setShowShortcuts] = useState(false);

  const bookingService = createBookingService(supabase);
  const roomService = createRoomService(supabase);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'd',
      description: 'Go to Dashboard',
      action: () => router.push('/dashboard'),
    },
    {
      key: 'r',
      description: 'Go to Rooms',
      action: () => router.push('/dashboard/rooms'),
    },
    {
      key: 'b',
      description: 'Go to Bookings',
      action: () => router.push('/dashboard/bookings'),
    },
    {
      key: 'u',
      description: 'Go to Users',
      action: () => router.push('/dashboard/users'),
    },
    {
      key: 'p',
      description: 'Go to Profile',
      action: () => router.push('/dashboard/profile'),
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcuts(true),
    },
  ]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // Load rooms
      const rooms = await roomService.getRooms();
      const activeRooms = rooms.filter((r) => r.status === 'active');

      // Load bookings
      const allBookings = await bookingService.getBookings();
      const todayBookings = allBookings.filter((b) => b.booking_date === today);
      const weekBookings = allBookings.filter((b) => b.booking_date >= weekAgoStr);

      // Load users
      const { data: users } = await supabase.from('users').select('*');
      const activeUsers = (users as UserType[])?.filter((u) => u.status === 'active') || [];

      setStats({
        totalRooms: rooms.length,
        activeRooms: activeRooms.length,
        totalBookingsToday: todayBookings.length,
        totalBookingsWeek: weekBookings.length,
        totalUsers: users?.length || 0,
        activeUsers: activeUsers.length,
      });
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Room Booking System</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <KeyboardShortcutsButton />
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Welcome to your Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your room booking system
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold">{stats.totalRooms}</h3>
                      <span className="text-sm text-green-600">{stats.activeRooms} active</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-100 p-3">
                    <DoorOpen className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bookings Today</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold">{stats.totalBookingsToday}</h3>
                      <span className="text-sm text-muted-foreground">{stats.totalBookingsWeek} this week</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-green-100 p-3">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
                      <span className="text-sm text-green-600">{stats.activeUsers} active</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-purple-100 p-3">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Activity</p>
                    <h3 className="text-2xl font-bold">
                      {((stats.totalBookingsWeek / 7) || 0).toFixed(1)}
                    </h3>
                    <p className="text-xs text-muted-foreground">bookings/day avg</p>
                  </div>
                  <div className="rounded-lg bg-orange-100 p-3">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/dashboard/rooms" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 transition-colors group-hover:bg-blue-200">
                    <DoorOpen className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110" />
                  </div>
                  <CardTitle className="transition-colors group-hover:text-blue-600">Rooms</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage meeting rooms and spaces
                </p>
                <div className="mt-4 flex items-center text-sm font-semibold text-blue-600 transition-transform group-hover:translate-x-1">
                  Manage Rooms
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/bookings" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-green-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2 transition-colors group-hover:bg-green-200">
                    <Calendar className="h-6 w-6 text-green-600 transition-transform group-hover:scale-110" />
                  </div>
                  <CardTitle className="transition-colors group-hover:text-green-600">Bookings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View and manage room bookings
                </p>
                <div className="mt-4 flex items-center text-sm font-semibold text-green-600 transition-transform group-hover:translate-x-1">
                  Manage Bookings
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/users" className="group">
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2 transition-colors group-hover:bg-purple-200">
                    <Users className="h-6 w-6 text-purple-600 transition-transform group-hover:scale-110" />
                  </div>
                  <CardTitle className="transition-colors group-hover:text-purple-600">Users</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage user accounts and permissions
                </p>
                <div className="mt-4 flex items-center text-sm font-semibold text-purple-600 transition-transform group-hover:translate-x-1">
                  Manage Users
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
          </div>
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

          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">
              ✅ Phase 3 Complete: Booking System
            </p>
            <p className="mt-1 text-xs text-green-700">
              Full booking management is now available. Users can book rooms on mobile, and admins can manage all bookings on web!
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800">
              🚀 Phase 4 Complete: User Management & Dashboard
            </p>
            <p className="mt-1 text-xs text-blue-700">
              User management and analytics dashboard now available! View real-time metrics and manage users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
