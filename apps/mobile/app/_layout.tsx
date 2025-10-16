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
