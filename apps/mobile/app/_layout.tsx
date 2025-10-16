import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth/context";
import { ErrorBoundary } from "../components/ErrorBoundary";
import Toast from "react-native-toast-message";
import "../global.css";

export default function RootLayout() {
	return (
		<ErrorBoundary>
			<SafeAreaProvider>
				<AuthProvider>
					<StatusBar style="auto" />
					<Slot />
					<Toast />
				</AuthProvider>
			</SafeAreaProvider>
		</ErrorBoundary>
	);
}
