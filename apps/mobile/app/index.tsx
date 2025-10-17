import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../lib/auth/context";

export default function Index() {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		// If user is authenticated, redirect to main app
		if (!loading && user) {
			console.log("[Index] User is authenticated, redirecting to main app");
			router.replace("/(tabs)/rooms");
		}
	}, [user, loading]);

	// Show loading state while checking authentication
	if (loading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-50">
				<ActivityIndicator size="large" color="#2563eb" />
				<Text className="text-gray-600 mt-4">Loading...</Text>
			</View>
		);
	}

	// If user is authenticated, don't render the landing page
	// (the useEffect will redirect them)
	if (user) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-50">
				<ActivityIndicator size="large" color="#2563eb" />
				<Text className="text-gray-600 mt-4">Redirecting...</Text>
			</View>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-slate-50">
			{/* Header with Sign In/Sign Up buttons */}
			<View className="border-b border-gray-200 bg-white shadow-sm">
				<View className="flex-row justify-between items-center px-6 py-4">
					<Text className="text-xl font-bold text-gray-900">
						Room Booking System
					</Text>
					<View className="flex-row gap-3">
						<Link href="/login" asChild>
							<TouchableOpacity className="px-4 py-2 rounded-lg border border-gray-300 bg-white">
								<Text className="text-gray-700 font-semibold">Sign In</Text>
							</TouchableOpacity>
						</Link>
						<Link href="/signup" asChild>
							<TouchableOpacity className="px-4 py-2 bg-blue-600 rounded-lg shadow-sm">
								<Text className="text-white font-semibold">Sign Up</Text>
							</TouchableOpacity>
						</Link>
					</View>
				</View>
			</View>

			{/* Main content */}
			<ScrollView className="flex-1" contentContainerClassName="p-6">
				<View className="items-center mt-8 mb-8">
					<Text className="text-4xl font-bold text-center mb-3 text-gray-900">
						Room Booking System
					</Text>
					<Text className="text-base text-gray-500 text-center">
						Mobile Application - React Native
					</Text>
				</View>

				<View className="gap-4">
					<View className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
						<Text className="text-xl font-semibold mb-2 text-gray-900">
							Expo SDK 52
						</Text>
						<Text className="text-sm text-gray-600">
							Latest Expo with React Native 0.76
						</Text>
					</View>

					<View className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
						<Text className="text-xl font-semibold mb-2 text-gray-900">
							Expo Router
						</Text>
						<Text className="text-sm text-gray-600">
							File-based routing for React Native
						</Text>
					</View>

					<View className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
						<Text className="text-xl font-semibold mb-2 text-gray-900">
							NativeWind
						</Text>
						<Text className="text-sm text-gray-600">
							Tailwind CSS for React Native
						</Text>
					</View>

					<View className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
						<Text className="text-xl font-semibold mb-2 text-gray-900">
							TypeScript
						</Text>
						<Text className="text-sm text-gray-600">
							End-to-end type safety with shared packages
						</Text>
					</View>
				</View>

				<View className="mt-8 p-5 bg-green-50 rounded-xl border border-green-200">
					<Text className="text-sm text-center font-semibold text-green-800">
						✅ Mobile app initialized successfully!
					</Text>
					<Text className="text-xs text-center text-green-700 mt-2">
						Phase 1, Task 1.3.5 Complete - Auth Logic Integrated
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
