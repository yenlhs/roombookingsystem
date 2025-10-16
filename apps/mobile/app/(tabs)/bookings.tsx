import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ListRenderItem,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { createBookingService, createNotificationService } from '@workspace/supabase';
import type { BookingWithDetails, BookingStatus } from '@workspace/types';
import { useFadeIn, useListItemAnimation } from '../../lib/animations';
import { lightImpact, mediumImpact, warningFeedback } from '../../lib/haptics';
import { FLATLIST_CONFIG } from '../../lib/performance';

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getDisplayStatus = (booking: BookingWithDetails): string => {
  const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
  const now = new Date();

  if (booking.status === 'cancelled') {
    return 'Cancelled';
  }

  if (booking.status === 'completed' || (booking.status === 'confirmed' && bookingDateTime < now)) {
    return 'Past';
  }

  if (booking.status === 'confirmed' && bookingDateTime > now) {
    return 'Upcoming';
  }

  return booking.status;
};

const getStatusColor = (displayStatus: string) => {
  switch (displayStatus.toLowerCase()) {
    case 'upcoming':
      return 'bg-blue-100';
    case 'past':
      return 'bg-gray-100';
    case 'cancelled':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
};

const getStatusTextColor = (displayStatus: string) => {
  switch (displayStatus.toLowerCase()) {
    case 'upcoming':
      return 'text-blue-800';
    case 'past':
      return 'text-gray-800';
    case 'cancelled':
      return 'text-red-800';
    default:
      return 'text-gray-800';
  }
};

const isUpcoming = (booking: BookingWithDetails): boolean => {
  const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
  return bookingDateTime > new Date() && booking.status === 'confirmed';
};

// Booking Card Component
function BookingCard({
  booking,
  index,
  onCancel,
  onEdit,
}: {
  booking: BookingWithDetails;
  index: number;
  onCancel: (booking: BookingWithDetails) => void;
  onEdit: (booking: BookingWithDetails) => void;
}) {
  const animatedStyle = useListItemAnimation(index);

  const displayStatus = getDisplayStatus(booking);

  return (
    <Animated.View style={animatedStyle}>
      <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
        {/* Room Name & Status */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-4">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {booking.room?.name || 'Unknown Room'}
            </Text>
            <Text className="text-sm text-gray-600">{formatDate(booking.booking_date)}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${getStatusColor(displayStatus)}`}>
            <Text
              className={`text-xs font-semibold ${getStatusTextColor(displayStatus)} uppercase`}
            >
              {displayStatus}
            </Text>
          </View>
        </View>

        {/* Time & Details */}
        <View className="border-t border-gray-100 pt-3 space-y-2">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">🕐</Text>
            <Text className="text-sm text-gray-700 font-medium">
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </Text>
          </View>

          {booking.room?.capacity && (
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">👥</Text>
              <Text className="text-sm text-gray-700 font-medium">
                Capacity: {booking.room.capacity} seats
              </Text>
            </View>
          )}

          {booking.notes && (
            <View className="flex-row items-start">
              <Text className="text-2xl mr-2">📝</Text>
              <Text className="text-sm text-gray-700 flex-1">{booking.notes}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {isUpcoming(booking) && (
          <View className="mt-3 pt-3 border-t border-gray-100 flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                onEdit(booking);
              }}
              className="flex-1 bg-blue-50 border border-blue-200 rounded-lg py-3 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-blue-700 font-semibold">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                warningFeedback();
                onCancel(booking);
              }}
              className="flex-1 bg-red-50 border border-red-200 rounded-lg py-3 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-red-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'cancelled' && booking.cancellation_reason && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-xs text-gray-500 mb-1">Cancellation Reason:</Text>
            <Text className="text-sm text-gray-700">{booking.cancellation_reason}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | BookingStatus>('all');

  const bookingService = createBookingService(supabase);
  const notificationService = createNotificationService(supabase);
  const headerAnimation = useFadeIn();

  useEffect(() => {
    loadBookings();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('my-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('Booking change received:', payload);
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, filterStatus]);

  const loadBookings = async () => {
    try {
      setError(null);
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    if (filterStatus !== 'all') {
      filtered = filtered.filter((booking) => booking.status === filterStatus);
    }

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = (booking: BookingWithDetails) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel this booking?\n\nRoom: ${booking.room?.name}\nDate: ${formatDate(booking.booking_date)}\nTime: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`,
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => lightImpact(),
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              mediumImpact();
              await bookingService.cancelBooking({ id: booking.id });

              // Send cancellation notification
              try {
                await notificationService.sendBookingNotification({
                  bookingId: booking.id,
                  notificationType: 'booking_cancelled',
                });
                console.log('[Booking] Cancellation notification sent');
              } catch (notifError) {
                console.warn('[Booking] Failed to send cancellation notification:', notifError);
              }

              Alert.alert('Success', 'Booking cancelled successfully');
              loadBookings();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const handleEditBooking = (booking: BookingWithDetails) => {
    lightImpact();
    router.push(`/edit-booking/${booking.id}` as any);
  };

  const renderBookingCard: ListRenderItem<BookingWithDetails> = ({ item, index }) => (
    <BookingCard booking={item} index={index} onCancel={handleCancelBooking} onEdit={handleEditBooking} />
  );

  const renderListHeader = () => (
    <View>
      {/* Header */}
      <Animated.View style={headerAnimation} className="mb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">My Bookings</Text>
        <Text className="text-base text-gray-600">Manage your room reservations</Text>
      </Animated.View>

      {/* Error Message */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <Text className="text-sm text-red-800">{error}</Text>
        </View>
      )}

      {/* Filters */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-900 mb-2">Filter by Status</Text>
        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setFilterStatus('all');
            }}
            className={`px-4 py-2 rounded-full border ${
              filterStatus === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                filterStatus === 'all' ? 'text-white' : 'text-gray-700'
              }`}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setFilterStatus('confirmed' as BookingStatus);
            }}
            className={`px-4 py-2 rounded-full border ${
              filterStatus === 'confirmed'
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-gray-300'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                filterStatus === 'confirmed' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setFilterStatus('completed' as BookingStatus);
            }}
            className={`px-4 py-2 rounded-full border ${
              filterStatus === 'completed'
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-gray-300'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                filterStatus === 'completed' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Past
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setFilterStatus('cancelled' as BookingStatus);
            }}
            className={`px-4 py-2 rounded-full border ${
              filterStatus === 'cancelled'
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-gray-300'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                filterStatus === 'cancelled' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Count */}
      <View className="mb-4">
        <Text className="text-sm text-gray-600">
          {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'} found
        </Text>
      </View>
    </View>
  );

  const renderListEmpty = () => (
    <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-200 mx-6">
      <Text className="text-4xl mb-3">📅</Text>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">No bookings found</Text>
      <Text className="text-sm text-gray-600 text-center mb-4">
        You haven't made any bookings yet. Browse rooms to get started!
      </Text>
      <TouchableOpacity
        onPress={() => {
          mediumImpact();
          router.push('/rooms' as any);
        }}
        className="bg-blue-600 rounded-lg px-6 py-3"
        activeOpacity={0.7}
      >
        <Text className="text-white font-bold">Browse Rooms</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 96 }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        onRefresh={onRefresh}
        refreshing={refreshing}
        {...FLATLIST_CONFIG}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}
