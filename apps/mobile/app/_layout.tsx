import { useEffect } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth/context";
import { ErrorBoundary } from "../components/ErrorBoundary";
import Toast from "react-native-toast-message";
import { useNotifications } from "../lib/hooks/use-notifications";
import "../global.css";

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
		(global as any).ErrorUtils?.setGlobalHandler?.(errorHandler);
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
				<AuthProvider>
					<AppContent />
				</AuthProvider>
			</SafeAreaProvider>
		</ErrorBoundary>
	);
}
