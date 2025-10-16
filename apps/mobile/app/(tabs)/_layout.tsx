import { Tabs } from 'expo-router';
import { ProtectedRoute } from '../../lib/auth/protected-route';

export default function TabsLayout() {
  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#2563eb',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            headerTitle: 'Room Booking System',
          }}
        />
        <Tabs.Screen
          name="rooms"
          options={{
            title: 'Rooms',
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
