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
import { registerSchema, type RegisterInput } from "@workspace/validation";
import { useAuth } from "../lib/auth/context";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    try {
      await signUp(data);
      console.log("[Signup] Sign up successful, redirecting to app");
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
          contentContainerClassName="p-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900 mb-3">
                Create an account
              </Text>
              <Text className="text-base text-gray-600 leading-relaxed">
                Enter your information to create your account
              </Text>
            </View>

            {/* Form */}
            <View className="gap-5">
              {/* Full Name Field */}
              <View>
                <Text className="text-sm font-semibold text-gray-900 mb-2">
                  Full Name
                </Text>
                <Controller
                  control={control}
                  name="full_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`w-full border ${
                        errors.full_name ? "border-red-500" : "border-gray-300"
                      } rounded-lg px-4 py-3.5 text-base bg-white text-gray-900`}
                      placeholder="John Doe"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      editable={!isLoading}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.full_name && (
                  <Text className="text-sm text-red-600 mt-1.5">
                    {errors.full_name.message}
                  </Text>
                )}
              </View>

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

              {/* Phone Field */}
              <View>
                <Text className="text-sm font-semibold text-gray-900 mb-2">
                  Phone Number{" "}
                  <Text className="text-gray-500 font-normal">(optional)</Text>
                </Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`w-full border ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      } rounded-lg px-4 py-3.5 text-base bg-white text-gray-900`}
                      placeholder="1234567890"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      editable={!isLoading}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.phone && (
                  <Text className="text-sm text-red-600 mt-1.5">
                    {errors.phone.message}
                  </Text>
                )}
              </View>

              {/* Password Field */}
              <View>
                <Text className="text-sm font-semibold text-gray-900 mb-2">
                  Password
                </Text>
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
                <Text className="text-xs text-gray-500 mt-1.5">
                  Must be at least 8 characters with uppercase, lowercase, and
                  number
                </Text>
              </View>

              {/* Confirm Password Field */}
              <View>
                <Text className="text-sm font-semibold text-gray-900 mb-2">
                  Confirm Password
                </Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`w-full border ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg px-4 py-3.5 text-base bg-white text-gray-900`}
                      placeholder="Confirm your password"
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
                {errors.confirmPassword && (
                  <Text className="text-sm text-red-600 mt-1.5">
                    {errors.confirmPassword.message}
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
                    Create account
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="mt-8 pt-6 border-t border-gray-200">
              <Text className="text-sm text-gray-600 text-center">
                Already have an account?{" "}
                <Link href="/login" asChild>
                  <Text className="text-blue-600 font-semibold">Sign in</Text>
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
