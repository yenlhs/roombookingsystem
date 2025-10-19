"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/context";
import { useAdmin } from "../../lib/hooks/use-admin";
import { Loader2, ShieldAlert } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Component to protect admin-only routes
 * Requires user to be authenticated AND have admin role
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading, error } = useAdmin();
  const router = useRouter();

  const loading = authLoading || adminLoading;

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    // Redirect to dashboard if authenticated but not admin
    if (!loading && user && !isAdmin && !error) {
      router.push("/dashboard");
    }
  }, [user, authLoading, loading, isAdmin, error, router]);

  // Show loading spinner while checking auth and admin status
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Verifying permissions...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if admin check failed
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md p-6">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Permission Error</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Unable to verify your admin permissions. Please try refreshing the
            page.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If no user or not admin after loading, don't render children (will redirect)
  if (!user || !isAdmin) {
    return null;
  }

  // User is authenticated and is admin, render children
  return <>{children}</>;
}
