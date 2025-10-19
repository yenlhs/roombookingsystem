import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Header with Sign In/Sign Up buttons */}
      <header className="w-full border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="text-xl font-bold">Room Booking System</div>
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="z-10 max-w-6xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Room Booking System</h1>
            <p className="text-xl text-muted-foreground mb-4">
              Admin Dashboard - Web Application
            </p>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto">
              A modern room booking system built with a monorepo architecture,
              featuring a web admin dashboard and mobile application. Manage
              rooms, bookings, and users with real-time synchronization powered
              by Supabase.
            </p>
          </div>

          {/* Tech Stack Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">Tech Stack</h2>

            {/* Frontend & Frameworks */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-center">
                Frontend & Frameworks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">Next.js 15</h4>
                  <p className="text-sm text-muted-foreground">
                    React Server Components, App Router, and React 19
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">
                    Expo React Native
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Cross-platform mobile app with Expo Router
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">TypeScript</h4>
                  <p className="text-sm text-muted-foreground">
                    End-to-end type safety with shared types
                  </p>
                </div>
              </div>
            </div>

            {/* Backend & Database */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-center">
                Backend & Database
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">Supabase</h4>
                  <p className="text-sm text-muted-foreground">
                    PostgreSQL database, authentication, and storage
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">
                    Row Level Security
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Database-level security with RLS policies
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">Real-time Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Live updates between web and mobile apps
                  </p>
                </div>
              </div>
            </div>

            {/* UI & Styling */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-center">
                UI & Styling
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">Tailwind CSS</h4>
                  <p className="text-sm text-muted-foreground">
                    Utility-first CSS framework
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">Radix UI</h4>
                  <p className="text-sm text-muted-foreground">
                    Accessible component primitives
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">NativeWind</h4>
                  <p className="text-sm text-muted-foreground">
                    Tailwind for React Native mobile app
                  </p>
                </div>
              </div>
            </div>

            {/* State & Data Management */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-center">
                State & Data Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">TanStack Query</h4>
                  <p className="text-sm text-muted-foreground">
                    Server state management and caching
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">
                    React Hook Form
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Performant form validation
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">Zod</h4>
                  <p className="text-sm text-muted-foreground">
                    Schema validation with TypeScript
                  </p>
                </div>
              </div>
            </div>

            {/* Development Tools */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-center">
                Development Tools
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">Turborepo</h4>
                  <p className="text-sm text-muted-foreground">
                    Monorepo build system with caching
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">pnpm</h4>
                  <p className="text-sm text-muted-foreground">
                    Fast, disk space efficient package manager
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">
                    ESLint & Prettier
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Code linting and formatting
                  </p>
                </div>
              </div>
            </div>

            {/* Payment & Additional Features */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-center">
                Additional Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">
                    Stripe Integration
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Payment processing for mobile app
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">
                    Expo Notifications
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Push notifications for mobile users
                  </p>
                </div>
                <div className="p-6 border rounded-lg bg-card">
                  <h4 className="text-lg font-semibold mb-2">
                    Expo Image Picker
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Image uploads and profile avatars
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Overview */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="text-xl font-semibold mb-3">
                  Web Admin Dashboard
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Comprehensive room management with CRUD operations</li>
                  <li>• Booking management and analytics</li>
                  <li>• User management and role-based access</li>
                  <li>• Subscription and payment tracking</li>
                </ul>
              </div>
              <div className="p-6 border rounded-lg bg-card">
                <h3 className="text-xl font-semibold mb-3">Mobile App</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Browse and book rooms by hourly slots</li>
                  <li>• Real-time availability updates</li>
                  <li>• User authentication and profile management</li>
                  <li>• Push notifications for booking updates</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Project Architecture */}
          <div className="mt-12 p-6 bg-primary/5 rounded-lg border">
            <h2 className="text-2xl font-bold text-center mb-4">
              Project Architecture
            </h2>
            <p className="text-center text-muted-foreground mb-4">
              Monorepo with shared packages for types, utilities, validation
              schemas, and Supabase client
            </p>
            <div className="flex justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="font-semibold mb-1">Apps</div>
                <div className="text-muted-foreground">Web • Mobile</div>
              </div>
              <div className="text-center">
                <div className="font-semibold mb-1">Packages</div>
                <div className="text-muted-foreground">
                  Types • Utils • Validation • Supabase
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold mb-1">Backend</div>
                <div className="text-muted-foreground">
                  Supabase • PostgreSQL
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
