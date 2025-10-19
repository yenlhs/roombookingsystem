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
        <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
          <h1 className="text-4xl font-bold text-center mb-4">
            Room Booking System
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Admin Dashboard - Web Application
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Next.js 15</h2>
              <p className="text-sm text-muted-foreground">
                React Server Components and App Router
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">TypeScript</h2>
              <p className="text-sm text-muted-foreground">
                End-to-end type safety with shared packages
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Tailwind CSS</h2>
              <p className="text-sm text-muted-foreground">
                Utility-first CSS framework
              </p>
            </div>

            <div className="p-6 border rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Supabase</h2>
              <p className="text-sm text-muted-foreground">
                PostgreSQL database with authentication
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-center">
              <span className="font-semibold">Status:</span> Web app initialized
              successfully! ✅
            </p>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Phase 1, Task 1.3.2 Complete
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
