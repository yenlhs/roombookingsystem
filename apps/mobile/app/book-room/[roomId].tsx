import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import {
  createBookingService,
  createRoomService,
  createNotificationService,
} from "@workspace/supabase";
import type { Room, TimeSlot, RoomAvailability } from "@workspace/types";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookRoomScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking form state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availability, setAvailability] = useState<RoomAvailability | null>(
    null,
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");

  // Step management
  const [step, setStep] = useState<"date" | "slot" | "confirm">("date");

  const roomService = createRoomService(supabase);
  const bookingService = createBookingService(supabase);
  const notificationService = createNotificationService(supabase);

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      setError(null);
      const data = await roomService.getRoomById(roomId as string);
      setRoom(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load room");
    } finally {
      setLoading(false);
    }
  };

  const generateDateOptions = (): string[] => {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }

    return dates;
  };

  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (dateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    setError(null);

    try {
      const availabilityData = await bookingService.getRoomAvailability(
        roomId as string,
        date,
      );
      setAvailability(availabilityData);
      setStep("slot");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load time slots",
      );
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
    setStep("confirm");
  };

  const handleCreateBooking = async () => {
    if (!selectedSlot || !selectedDate) {
      Alert.alert("Error", "Please select a date and time slot");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "You must be logged in to create a booking");
        return;
      }

      const newBooking = await bookingService.createBooking({
        user_id: user.id,
        room_id: roomId as string,
        booking_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        notes: notes.trim() || undefined,
      });

      // Send booking confirmation notification
      try {
        await notificationService.sendBookingNotification({
          bookingId: newBooking.id,
          notificationType: "booking_confirmed",
        });
        console.log("[Booking] Notification sent successfully");
      } catch (notifError) {
        // Don't fail the booking if notification fails
        console.warn("[Booking] Failed to send notification:", notifError);
      }

      Alert.alert("Success!", "Your booking has been confirmed", [
        {
          text: "View My Bookings",
          onPress: () => router.push("/bookings" as any),
        },
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create booking",
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  if (error && !room) {
    return (
      <View className="flex-1 bg-slate-50 p-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-blue-600 font-semibold text-base">← Back</Text>
        </TouchableOpacity>
        <View className="bg-red-50 border border-red-200 rounded-lg p-4">
          <Text className="text-sm text-red-800">{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1">
        <View className="p-6 pb-24">
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Text className="text-blue-600 font-semibold text-base">
              ← Back to Room
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Book a Room
            </Text>
            <Text className="text-xl text-gray-700">{room?.name}</Text>
          </View>

          {/* Progress Steps */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1 items-center">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  step === "date" ? "bg-blue-600" : "bg-green-600"
                }`}
              >
                <Text className="text-white font-bold">1</Text>
              </View>
              <Text className="text-xs mt-1 text-gray-600">Date</Text>
            </View>
            <View className="flex-1 h-0.5 bg-gray-300" />
            <View className="flex-1 items-center">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  step === "slot"
                    ? "bg-blue-600"
                    : step === "confirm"
                      ? "bg-green-600"
                      : "bg-gray-300"
                }`}
              >
                <Text
                  className={`${step === "date" ? "text-gray-500" : "text-white"} font-bold`}
                >
                  2
                </Text>
              </View>
              <Text className="text-xs mt-1 text-gray-600">Time</Text>
            </View>
            <View className="flex-1 h-0.5 bg-gray-300" />
            <View className="flex-1 items-center">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  step === "confirm" ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <Text
                  className={`${step === "confirm" ? "text-white" : "text-gray-500"} font-bold`}
                >
                  3
                </Text>
              </View>
              <Text className="text-xs mt-1 text-gray-600">Confirm</Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <Text className="text-sm text-red-800">{error}</Text>
            </View>
          )}

          {/* Step 1: Date Selection */}
          {step === "date" && (
            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">
                Select a Date
              </Text>
              <View className="gap-3">
                {generateDateOptions().map((date) => (
                  <TouchableOpacity
                    key={date}
                    onPress={() => handleDateSelect(date)}
                    className={`bg-white rounded-xl p-4 border-2 ${
                      selectedDate === date
                        ? "border-blue-600"
                        : "border-gray-200"
                    }`}
                  >
                    <Text className="text-lg font-semibold text-gray-900">
                      {formatDateDisplay(date)}
                    </Text>
                    <Text className="text-sm text-gray-600">{date}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 2: Time Slot Selection */}
          {step === "slot" && (
            <View>
              <TouchableOpacity
                onPress={() => setStep("date")}
                className="mb-4"
              >
                <Text className="text-blue-600 font-semibold">
                  ← Change Date
                </Text>
              </TouchableOpacity>

              <Text className="text-xl font-bold text-gray-900 mb-2">
                Select a Time Slot
              </Text>
              <Text className="text-base text-gray-600 mb-4">
                {formatDateDisplay(selectedDate)} • {selectedDate}
              </Text>

              {loadingSlots ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text className="text-gray-600 mt-4">
                    Loading available slots...
                  </Text>
                </View>
              ) : availability && availability.slots.length > 0 ? (
                <View className="gap-3">
                  {availability.slots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSlotSelect(slot)}
                      disabled={!slot.is_available}
                      className={`rounded-xl p-4 border-2 ${
                        !slot.is_available
                          ? "bg-gray-100 border-gray-200"
                          : selectedSlot?.start_time === slot.start_time
                            ? "bg-blue-50 border-blue-600"
                            : "bg-white border-gray-200"
                      }`}
                    >
                      <View className="flex-row justify-between items-center">
                        <Text
                          className={`text-lg font-semibold ${
                            !slot.is_available
                              ? "text-gray-400"
                              : "text-gray-900"
                          }`}
                        >
                          {formatTime(slot.start_time)} -{" "}
                          {formatTime(slot.end_time)}
                        </Text>
                        {!slot.is_available && (
                          <View className="bg-red-100 px-3 py-1 rounded-full">
                            <Text className="text-xs font-semibold text-red-800 uppercase">
                              Booked
                            </Text>
                          </View>
                        )}
                        {slot.is_available && (
                          <View className="bg-green-100 px-3 py-1 rounded-full">
                            <Text className="text-xs font-semibold text-green-800 uppercase">
                              Available
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View className="bg-white rounded-xl p-8 items-center">
                  <Text className="text-4xl mb-3">😔</Text>
                  <Text className="text-lg font-bold text-gray-900 mb-2">
                    No slots available
                  </Text>
                  <Text className="text-sm text-gray-600 text-center">
                    Please try a different date
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirm" && selectedSlot && (
            <View>
              <TouchableOpacity
                onPress={() => setStep("slot")}
                className="mb-4"
              >
                <Text className="text-blue-600 font-semibold">
                  ← Change Time
                </Text>
              </TouchableOpacity>

              <Text className="text-xl font-bold text-gray-900 mb-4">
                Confirm Your Booking
              </Text>

              {/* Booking Summary Card */}
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-4">
                  Booking Details
                </Text>

                <View className="space-y-3">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">🏢</Text>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 uppercase">
                        Room
                      </Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {room?.name}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">📅</Text>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 uppercase">
                        Date
                      </Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {formatDateDisplay(selectedDate)} • {selectedDate}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">🕐</Text>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 uppercase">
                        Time
                      </Text>
                      <Text className="text-base font-semibold text-gray-900">
                        {formatTime(selectedSlot.start_time)} -{" "}
                        {formatTime(selectedSlot.end_time)}
                      </Text>
                    </View>
                  </View>

                  {room?.capacity && (
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">👥</Text>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 uppercase">
                          Capacity
                        </Text>
                        <Text className="text-base font-semibold text-gray-900">
                          {room.capacity} people
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Notes Field */}
              <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 mb-6">
                <Text className="text-base font-bold text-gray-900 mb-2">
                  Notes (Optional)
                </Text>
                <TextInput
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base bg-white text-gray-900"
                  placeholder="Add any special requirements or notes..."
                  placeholderTextColor="#9CA3AF"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
                <Text className="text-xs text-gray-500 mt-2">
                  {notes.length}/500 characters
                </Text>
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                onPress={handleCreateBooking}
                disabled={creating}
                className={`bg-blue-600 rounded-2xl py-4 items-center shadow-sm ${
                  creating ? "opacity-70" : ""
                }`}
              >
                {creating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Confirm Booking
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
