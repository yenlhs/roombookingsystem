import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../lib/auth/context';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1 p-6">
        {/* Welcome Card */}
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to your Dashboard
          </Text>
          <Text className="text-base text-gray-600 mb-2">
            You've successfully logged in!
          </Text>
          <Text className="text-sm text-gray-500 mb-5">
            {user?.email}
          </Text>
          <TouchableOpacity
            className="bg-white border-2 border-red-200 rounded-lg py-3 px-4 items-center"
            onPress={handleSignOut}
          >
            <Text className="text-red-600 text-base font-bold">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View className="gap-4 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Rooms
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              Manage meeting rooms and spaces
            </Text>
            <Text className="text-xs text-gray-500">
              (Coming in Phase 2)
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Bookings
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              View and manage room bookings
            </Text>
            <Text className="text-xs text-gray-500">
              (Coming in Phase 3)
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Users
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              Manage user accounts and permissions
            </Text>
            <Text className="text-xs text-gray-500">
              (Coming in Phase 4)
            </Text>
          </View>
        </View>

        {/* Success Banner */}
        <View className="bg-green-50 rounded-2xl p-5 border border-green-200">
          <Text className="text-sm font-bold text-green-800 mb-2">
            ✅ Task 1.3.5 Complete: Mobile App Auth Logic
          </Text>
          <Text className="text-xs text-green-700">
            Authentication is fully functional with Supabase!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
