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
import { forgotPasswordSchema, type ForgotPasswordInput } from "@workspace/validation";
import { useAuth } from "../lib/auth/context";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await resetPassword(data);
      setSuccess(true);
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
                Reset password
              </Text>
              <Text className="text-base text-gray-600 leading-relaxed">
                Enter your email address and we'll send you a link to reset your
                password
              </Text>
            </View>

            {success ? (
              /* Success State */
              <View className="gap-5">
                <View className="bg-green-100 rounded-full w-20 h-20 items-center justify-center self-center mb-2">
                  <Text className="text-4xl text-green-600">✓</Text>
                </View>
                <View className="gap-3">
                  <Text className="text-xl font-bold text-gray-900 text-center">
                    Check your email
                  </Text>
                  <Text className="text-base text-gray-600 text-center leading-relaxed">
                    We've sent you a password reset link. Please check your email
                    and follow the instructions.
                  </Text>
                </View>
                <Link href="/login" asChild>
                  <TouchableOpacity className="w-full bg-blue-600 rounded-lg py-4 items-center shadow-md mt-4">
                    <Text className="text-white text-base font-bold">
                      Back to login
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            ) : (
              /* Form State */
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
                      Send reset link
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Back to Login */}
                <Link href="/login" asChild>
                  <TouchableOpacity
                    className="w-full py-3 items-center"
                    disabled={isLoading}
                  >
                    <Text className="text-gray-600 text-base font-medium">
                      ← Back to login
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}

            {/* Footer */}
            {!success && (
              <View className="mt-8 pt-6 border-t border-gray-200">
                <Text className="text-sm text-gray-600 text-center">
                  Don't have an account?{" "}
                  <Link href="/signup" asChild>
                    <Text className="text-blue-600 font-semibold">Sign up</Text>
                  </Link>
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
