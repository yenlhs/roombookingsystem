import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth/context";
import "../global.css";

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<AuthProvider>
				<StatusBar style="auto" />
				<Slot />
			</AuthProvider>
		</SafeAreaProvider>
	);
}
