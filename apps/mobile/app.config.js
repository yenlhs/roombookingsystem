export default {
	expo: {
		name: "Room Booking System",
		slug: "roombooking",
		version: "1.0.0",
		orientation: "portrait",
		icon: "./assets/icon.png",
		userInterfaceStyle: "automatic",
		scheme: "roombooking",
		splash: {
			image: "./assets/splash.png",
			resizeMode: "contain",
			backgroundColor: "#ffffff",
		},
		assetBundlePatterns: ["**/*"],
		ios: {
			supportsTablet: true,
			bundleIdentifier: "com.yenlhs.roombooking",
			config: {
				usesNonExemptEncryption: false,
			},
		},
		android: {
			adaptiveIcon: {
				foregroundImage: "./assets/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
			package: "com.yenlhs.roombooking",
		},
		web: {
			favicon: "./assets/favicon.png",
			bundler: "metro",
		},
		plugins: ["expo-router", "expo-secure-store", "expo-image-picker"],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			eas: {
				projectId: "628d6894-73d6-48a1-a480-94de302e0c76",
			},
			EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
			EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
		},
	},
};
