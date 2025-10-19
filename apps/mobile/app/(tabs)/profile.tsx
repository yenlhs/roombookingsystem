import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth/context";
import { useRouter } from "expo-router";
import { warningFeedback } from "../../lib/haptics";
import { supabase } from "../../lib/supabase";
import { createProfileService } from "@workspace/supabase";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@workspace/validation";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const profileService = createProfileService(supabase);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      reset({
        full_name: data.full_name,
        phone: data.phone || "",
        avatar_url: data.avatar_url || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await profileService.updateProfile(data);
      await loadProfile();

      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload an avatar",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pick image");
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      setError(null);

      const response = await fetch(uri);
      const blob = await response.blob();

      const avatarUrl = await profileService.uploadAvatar(blob);

      await loadProfile();
      setSuccess("Avatar uploaded successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    reset({
      full_name: profile?.full_name,
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || "",
    });
  };

  const handleSignOut = async () => {
    try {
      warningFeedback();
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  if (loading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 p-6">
        {/* Profile Header */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-4">
          <View className="items-center mb-6">
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploading}
              className="relative"
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="bg-blue-100 rounded-full w-24 h-24 items-center justify-center">
                  <Text className="text-4xl">👤</Text>
                </View>
              )}
              {uploading && (
                <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                  <ActivityIndicator color="white" />
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-blue-600 rounded-full w-8 h-8 items-center justify-center">
                <Text className="text-white text-xs">✏️</Text>
              </View>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900 mt-4">
              {profile?.full_name || "User"}
            </Text>
            <Text className="text-sm text-gray-500">{profile?.email}</Text>
          </View>

          {/* Success Message */}
          {success && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <Text className="text-sm text-green-800 text-center">
                {success}
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <Text className="text-sm text-red-800 text-center">{error}</Text>
            </View>
          )}

          {isEditing ? (
            <View className="gap-4">
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
                      } rounded-lg px-4 py-3 text-base bg-white text-gray-900`}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9CA3AF"
                      editable={!loading}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.full_name && (
                  <Text className="text-sm text-red-600 mt-1">
                    {errors.full_name.message}
                  </Text>
                )}
              </View>

              {/* Phone Field */}
              <View>
                <Text className="text-sm font-semibold text-gray-900 mb-2">
                  Phone (Optional)
                </Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`w-full border ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      } rounded-lg px-4 py-3 text-base bg-white text-gray-900`}
                      placeholder="1234567890"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                      editable={!loading}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.phone && (
                  <Text className="text-sm text-red-600 mt-1">
                    {errors.phone.message}
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  disabled={loading}
                  className="flex-1 border-2 border-gray-300 rounded-lg py-3 items-center"
                >
                  <Text className="text-gray-700 font-bold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  disabled={loading}
                  className={`flex-1 bg-blue-600 rounded-lg py-3 items-center ${
                    loading ? "opacity-70" : ""
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-bold">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="gap-4">
              <View className="py-3 border-b border-gray-200">
                <Text className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Full Name
                </Text>
                <Text className="text-base text-gray-900">
                  {profile?.full_name || "Not set"}
                </Text>
              </View>

              <View className="py-3 border-b border-gray-200">
                <Text className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Email
                </Text>
                <Text className="text-base text-gray-900">
                  {profile?.email}
                </Text>
              </View>

              <View className="py-3 border-b border-gray-200">
                <Text className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Phone
                </Text>
                <Text className="text-base text-gray-900">
                  {profile?.phone || "Not set"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="bg-blue-600 rounded-lg py-3 items-center mt-2"
              >
                <Text className="text-white font-bold">Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Account Section */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-2">Account</Text>
          <Text className="text-sm text-gray-600 mb-4">
            Manage your account settings and subscription
          </Text>

          {/* Subscription Button */}
          <TouchableOpacity
            onPress={() => router.push("/subscription")}
            className="bg-white border-2 border-blue-200 rounded-lg py-4 mb-3 flex-row items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="star" size={20} color="#2563eb" />
            <Text className="text-blue-600 text-base font-bold ml-2">
              Manage Subscription
            </Text>
          </TouchableOpacity>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-white border-2 border-red-200 rounded-lg py-4 items-center"
            activeOpacity={0.7}
          >
            <Text className="text-red-600 text-base font-bold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
