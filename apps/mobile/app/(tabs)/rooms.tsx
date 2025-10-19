import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ListRenderItem,
} from "react-native";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { createRoomService } from "@workspace/supabase";
import type { Room, RoomStatus } from "@workspace/types";
import { useFadeIn, useListItemAnimation } from "../../lib/animations";
import { lightImpact, selectionFeedback } from "../../lib/haptics";
import { FLATLIST_CONFIG, debounce } from "../../lib/performance";
import { SubscriptionBanner } from "../../components/SubscriptionBanner";
import { useSubscription } from "../../lib/hooks/use-subscription";

// Room Card Component with animations
function RoomCard({
  room,
  index,
  onPress,
  isLocked,
}: {
  room: Room;
  index: number;
  onPress: () => void;
  isLocked?: boolean;
}) {
  const animatedStyle = useListItemAnimation(index);

  const getRoomStatusColor = (status: RoomStatus) => {
    return status === "active" ? "bg-green-100" : "bg-gray-100";
  };

  const getRoomStatusTextColor = (status: RoomStatus) => {
    return status === "active" ? "text-green-800" : "text-gray-800";
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={() => {
          selectionFeedback();
          onPress();
        }}
        className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-200 ${isLocked ? "opacity-75" : ""}`}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center mb-1">
              <Text className="text-xl font-bold text-gray-900">
                {room.name}
              </Text>
              {room.is_exclusive && (
                <View className="ml-2 bg-purple-100 px-2 py-1 rounded-md flex-row items-center">
                  <Ionicons name="star" size={12} color="#7c3aed" />
                  <Text className="text-purple-700 text-xs ml-1 font-semibold">
                    Premium
                  </Text>
                </View>
              )}
              {isLocked && (
                <View className="ml-2">
                  <Ionicons name="lock-closed" size={16} color="#9ca3af" />
                </View>
              )}
            </View>
            {room.description && (
              <Text className="text-sm text-gray-600" numberOfLines={2}>
                {room.description}
              </Text>
            )}
          </View>
          <View
            className={`px-3 py-1 rounded-full ${getRoomStatusColor(room.status)}`}
          >
            <Text
              className={`text-xs font-semibold ${getRoomStatusTextColor(room.status)} uppercase`}
            >
              {room.status}
            </Text>
          </View>
        </View>

        <View className="border-t border-gray-100 pt-3 flex-row flex-wrap gap-4">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">👥</Text>
            <Text className="text-sm text-gray-700 font-medium">
              {room.capacity} seats
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">🕐</Text>
            <Text className="text-sm text-gray-700 font-medium">
              {room.operating_hours_start} - {room.operating_hours_end}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">⏱️</Text>
            <Text className="text-sm text-gray-700 font-medium">
              {room.slot_duration_minutes} min slots
            </Text>
          </View>
        </View>

        <View className="mt-3 pt-3 border-t border-gray-100">
          <Text className="text-blue-600 font-semibold text-sm">
            View Details →
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RoomsScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RoomStatus>("all");
  const [minCapacity, setMinCapacity] = useState<number | null>(null);

  const roomService = createRoomService(supabase);
  const headerAnimation = useFadeIn();
  const { isPremium } = useSubscription();

  // Debounced search handler
  const debouncedSetSearch = useMemo(
    () =>
      debounce((query: string) => {
        setDebouncedSearchQuery(query);
      }, 300),
    [],
  );

  // Load rooms
  useEffect(() => {
    console.log("[Rooms] Component mounted, loading rooms...");

    loadRooms().catch((err) => {
      console.error("[Rooms] Failed to load rooms:", err);
      setError(err instanceof Error ? err.message : "Failed to load rooms");
      setLoading(false);
    });

    // Subscribe to real-time updates
    const channel = supabase
      .channel("rooms-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
        },
        (payload) => {
          console.log("[Rooms] Room change received:", payload);
          // Reload rooms when changes occur
          loadRooms().catch((err) => {
            console.error("[Rooms] Failed to reload rooms:", err);
          });
        },
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      console.log("[Rooms] Component unmounting, cleaning up...");
      supabase.removeChannel(channel);
    };
  }, []);

  // Update debounced search when search query changes
  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  // Filter rooms when search or filters change
  useEffect(() => {
    applyFilters();
  }, [rooms, debouncedSearchQuery, statusFilter, minCapacity]);

  const loadRooms = async () => {
    try {
      setError(null);
      const data = await roomService.getActiveRooms();
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
  };

  const applyFilters = () => {
    let filtered = [...rooms];

    // Search by name or description
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(query) ||
          room.description?.toLowerCase().includes(query),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((room) => room.status === statusFilter);
    }

    // Filter by minimum capacity
    if (minCapacity !== null && minCapacity > 0) {
      filtered = filtered.filter(
        (room) => room.capacity && room.capacity >= minCapacity,
      );
    }

    setFilteredRooms(filtered);
  };

  const clearFilters = () => {
    lightImpact();
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setStatusFilter("all");
    setMinCapacity(null);
  };

  const renderRoomCard: ListRenderItem<Room> = ({ item, index }) => {
    const isLocked = item.is_exclusive && !isPremium;
    return (
      <RoomCard
        room={item}
        index={index}
        isLocked={isLocked}
        onPress={() => {
          if (isLocked) {
            router.push("/subscription");
          } else {
            router.push(`/room-details/${item.id}`);
          }
        }}
      />
    );
  };

  const renderListHeader = () => (
    <View>
      {/* Header */}
      <Animated.View style={headerAnimation} className="mb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Browse Rooms
        </Text>
        <Text className="text-base text-gray-600">
          Find the perfect space for your meeting
        </Text>
      </Animated.View>

      {/* Subscription Banner */}
      <SubscriptionBanner />

      {/* Error Message */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <Text className="text-sm text-red-800">{error}</Text>
        </View>
      )}

      {/* Search Bar */}
      <View className="mb-4">
        <TextInput
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white text-gray-900"
          placeholder="Search rooms by name..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-900 mb-2">
          Filters
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {/* Status Filter */}
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setStatusFilter("all");
            }}
            className={`px-4 py-2 rounded-full border ${
              statusFilter === "all"
                ? "bg-blue-600 border-blue-600"
                : "bg-white border-gray-300"
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                statusFilter === "all" ? "text-white" : "text-gray-700"
              }`}
            >
              All Rooms
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setStatusFilter("active" as RoomStatus);
            }}
            className={`px-4 py-2 rounded-full border ${
              statusFilter === "active"
                ? "bg-blue-600 border-blue-600"
                : "bg-white border-gray-300"
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-medium ${
                statusFilter === "active" ? "text-white" : "text-gray-700"
              }`}
            >
              Active
            </Text>
          </TouchableOpacity>

          {/* Capacity Filters */}
          {[5, 10, 20].map((capacity) => (
            <TouchableOpacity
              key={capacity}
              onPress={() => {
                lightImpact();
                setMinCapacity(minCapacity === capacity ? null : capacity);
              }}
              className={`px-4 py-2 rounded-full border ${
                minCapacity === capacity
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-300"
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm font-medium ${
                  minCapacity === capacity ? "text-white" : "text-gray-700"
                }`}
              >
                {capacity}+ seats
              </Text>
            </TouchableOpacity>
          ))}

          {/* Clear Filters */}
          {(searchQuery || statusFilter !== "all" || minCapacity !== null) && (
            <TouchableOpacity
              onPress={clearFilters}
              className="px-4 py-2 rounded-full bg-gray-100 border border-gray-300"
            >
              <Text className="text-sm font-medium text-gray-700">
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Count */}
      <View className="mb-4">
        <Text className="text-sm text-gray-600">
          {filteredRooms.length} {filteredRooms.length === 1 ? "room" : "rooms"}{" "}
          found
        </Text>
      </View>
    </View>
  );

  const renderListEmpty = () => (
    <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-200 mx-6">
      <Text className="text-4xl mb-3">🔍</Text>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        No rooms found
      </Text>
      <Text className="text-sm text-gray-600 text-center mb-4">
        Try adjusting your search or filters
      </Text>
      {(searchQuery || statusFilter !== "all" || minCapacity !== null) && (
        <TouchableOpacity
          onPress={clearFilters}
          className="bg-blue-600 rounded-lg px-6 py-3"
          activeOpacity={0.7}
        >
          <Text className="text-white font-bold">Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading rooms...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={filteredRooms}
        renderItem={renderRoomCard}
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
