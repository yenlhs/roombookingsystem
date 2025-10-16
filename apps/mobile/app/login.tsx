import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@workspace/validation";
import { useAuth } from "../lib/auth/context";

export default function LoginScreen() {
	const router = useRouter();
	const { signIn } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginInput) => {
		setIsLoading(true);
		setError(null);

		try {
			await signIn(data);
			console.log("[Login] Sign in successful, redirecting to app");
			router.replace("/(tabs)/rooms");
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-slate-50">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1"
			>
				<ScrollView
					className="flex-1"
					contentContainerClassName="flex-grow justify-center p-6"
					keyboardShouldPersistTaps="handled"
				>
					<View className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
						{/* Header */}
						<View className="mb-8">
							<Text className="text-3xl font-bold text-gray-900 mb-3">
								Sign in
							</Text>
							<Text className="text-base text-gray-600 leading-relaxed">
								Enter your email and password to access your account
							</Text>
						</View>

						{/* Form */}
						<View className="gap-5">
							{/* Email Field */}
							<View>
								<Text className="text-sm font-semibold text-gray-900 mb-2">
									Email
								</Text>
								<Controller
									control={control}
									name="email"
									render={({ field: { onChange, onBlur, value } }) => (
										<TextInput
											className={`w-full border ${
												errors.email ? "border-red-500" : "border-gray-300"
											} rounded-lg px-4 py-3.5 text-base bg-white text-gray-900`}
											placeholder="name@example.com"
											placeholderTextColor="#9CA3AF"
											keyboardType="email-address"
											autoCapitalize="none"
											autoCorrect={false}
											editable={!isLoading}
											onBlur={onBlur}
											onChangeText={onChange}
											value={value}
										/>
									)}
								/>
								{errors.email && (
									<Text className="text-sm text-red-600 mt-1.5">
										{errors.email.message}
									</Text>
								)}
							</View>

							{/* Password Field */}
							<View>
								<View className="flex-row justify-between items-center mb-2">
									<Text className="text-sm font-semibold text-gray-900">
										Password
									</Text>
									<Link href="/forgot-password" asChild>
										<TouchableOpacity>
											<Text className="text-sm text-blue-600 font-medium">
												Forgot password?
											</Text>
										</TouchableOpacity>
									</Link>
								</View>
								<Controller
									control={control}
									name="password"
									render={({ field: { onChange, onBlur, value } }) => (
										<TextInput
											className={`w-full border ${
												errors.password ? "border-red-500" : "border-gray-300"
											} rounded-lg px-4 py-3.5 text-base bg-white text-gray-900`}
											placeholder="Enter your password"
											placeholderTextColor="#9CA3AF"
											secureTextEntry
											autoCapitalize="none"
											editable={!isLoading}
											onBlur={onBlur}
											onChangeText={onChange}
											value={value}
										/>
									)}
								/>
								{errors.password && (
									<Text className="text-sm text-red-600 mt-1.5">
										{errors.password.message}
									</Text>
								)}
							</View>

							{/* Error Message */}
							{error && (
								<View className="bg-red-50 border border-red-200 rounded-lg p-4">
									<Text className="text-sm text-red-800">{error}</Text>
								</View>
							)}

							{/* Submit Button */}
							<TouchableOpacity
								className={`w-full bg-blue-600 rounded-lg py-4 items-center shadow-md mt-2 ${
									isLoading ? "opacity-70" : ""
								}`}
								onPress={handleSubmit(onSubmit)}
								disabled={isLoading}
							>
								{isLoading ? (
									<ActivityIndicator color="white" size="small" />
								) : (
									<Text className="text-white text-base font-bold">
										Sign in
									</Text>
								)}
							</TouchableOpacity>
						</View>

						{/* Footer */}
						<View className="mt-8 pt-6 border-t border-gray-200">
							<Text className="text-sm text-gray-600 text-center">
								Don't have an account?{" "}
								<Link href="/signup" asChild>
									<Text className="text-blue-600 font-semibold">Sign up</Text>
								</Link>
							</Text>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
