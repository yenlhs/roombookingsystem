import { useEffect } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../lib/auth/context";
import { ErrorBoundary } from "../components/ErrorBoundary";
import Toast from "react-native-toast-message";
import { useNotifications } from "../lib/hooks/use-notifications";
import "../global.css";

const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function AppContent() {
  // Initialize notifications
  useNotifications();

  // Set up global error handlers
  useEffect(() => {
    const errorHandler = (error: Error) => {
      console.error("[Global Error Handler]", error);
      console.error("[Global Error Stack]", error.stack);
    };

    // Add global error listeners
    (globalThis as any).ErrorUtils?.setGlobalHandler?.(errorHandler);
    console.log("[App] Global error handler installed");

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Slot />
      <Toast />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </StripeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
