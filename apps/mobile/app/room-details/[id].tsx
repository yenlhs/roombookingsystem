import { useState, useEffect } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { createRoomService } from "@workspace/supabase";
import type { Room, RoomStatus } from "@workspace/types";

export default function RoomDetailsScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [room, setRoom] = useState<Room | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const roomService = createRoomService(supabase);

	useEffect(() => {
		if (id) {
			loadRoom();

			// Subscribe to real-time updates for this specific room
			const channel = supabase
				.channel(`room-${id}-changes`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "rooms",
						filter: `id=eq.${id}`,
					},
					(payload) => {
						console.log("Room update received:", payload);
						// Reload room when changes occur
						loadRoom();
					}
				)
				.subscribe();

			// Cleanup subscription on unmount
			return () => {
				supabase.removeChannel(channel);
			};
		}
	}, [id]);

	const loadRoom = async () => {
		try {
			setError(null);
			const data = await roomService.getRoomById(id as string);
			setRoom(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load room");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadRoom();
	};

	const getRoomStatusColor = (status: RoomStatus) => {
		return status === "active" ? "bg-green-100" : "bg-gray-100";
	};

	const getRoomStatusTextColor = (status: RoomStatus) => {
		return status === "active" ? "text-green-800" : "text-gray-800";
	};

	if (loading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-50">
				<ActivityIndicator size="large" color="#2563eb" />
				<Text className="text-gray-600 mt-4">Loading room details...</Text>
			</View>
		);
	}

	if (error || !room) {
		return (
			<SafeAreaView className="flex-1 bg-slate-50">
				<View className="p-6">
					{/* Back Button */}
					<TouchableOpacity onPress={() => router.back()} className="mb-6">
						<Text className="text-blue-600 font-semibold text-base">
							← Back to Rooms
						</Text>
					</TouchableOpacity>

					{/* Error State */}
					<View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-200">
						<Text className="text-4xl mb-3">❌</Text>
						<Text className="text-xl font-bold text-gray-900 mb-2 text-center">
							Room Not Found
						</Text>
						<Text className="text-sm text-gray-600 text-center mb-4">
							{error ||
								"The room you are looking for does not exist or has been removed."}
						</Text>
						<TouchableOpacity
							onPress={() => router.back()}
							className="bg-blue-600 rounded-lg px-6 py-3"
						>
							<Text className="text-white font-bold">Go Back</Text>
						</TouchableOpacity>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-slate-50">
			<ScrollView
				className="flex-1"
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#2563eb"
					/>
				}
			>
				<View className="p-6 pb-24">
					{/* Back Button */}
					<TouchableOpacity onPress={() => router.back()} className="mb-6">
						<Text className="text-blue-600 font-semibold text-base">
							← Back to Rooms
						</Text>
					</TouchableOpacity>

					{/* Room Header Card */}
					<View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-4">
						<View className="flex-row justify-between items-start mb-4">
							<View className="flex-1 mr-4">
								<Text className="text-3xl font-bold text-gray-900 mb-2">
									{room.name}
								</Text>
								{room.description && (
									<Text className="text-base text-gray-600 leading-relaxed">
										{room.description}
									</Text>
								)}
							</View>
							<View
								className={`px-4 py-2 rounded-full ${getRoomStatusColor(room.status)}`}
							>
								<Text
									className={`text-xs font-semibold ${getRoomStatusTextColor(
										room.status
									)} uppercase tracking-wide`}
								>
									{room.status}
								</Text>
							</View>
						</View>

						{room.status === "inactive" && (
							<View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
								<Text className="text-sm text-yellow-800">
									⚠️ This room is currently inactive and not available for
									booking
								</Text>
							</View>
						)}
					</View>

					{/* Room Details Card */}
					<View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-4">
						<Text className="text-xl font-bold text-gray-900 mb-4">
							Room Details
						</Text>

						{/* Capacity */}
						<View className="flex-row items-center py-4 border-b border-gray-100">
							<View className="bg-blue-50 rounded-full w-12 h-12 items-center justify-center mr-4">
								<Text className="text-2xl">👥</Text>
							</View>
							<View className="flex-1">
								<Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
									Capacity
								</Text>
								<Text className="text-base font-medium text-gray-900">
									{room.capacity ? `${room.capacity} people` : "Not specified"}
								</Text>
							</View>
						</View>

						{/* Operating Hours */}
						<View className="flex-row items-center py-4 border-b border-gray-100">
							<View className="bg-green-50 rounded-full w-12 h-12 items-center justify-center mr-4">
								<Text className="text-2xl">🕐</Text>
							</View>
							<View className="flex-1">
								<Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
									Operating Hours
								</Text>
								<Text className="text-base font-medium text-gray-900">
									{room.operating_hours_start} - {room.operating_hours_end}
								</Text>
							</View>
						</View>

						{/* Slot Duration */}
						<View className="flex-row items-center py-4">
							<View className="bg-purple-50 rounded-full w-12 h-12 items-center justify-center mr-4">
								<Text className="text-2xl">⏱️</Text>
							</View>
							<View className="flex-1">
								<Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
									Booking Slot Duration
								</Text>
								<Text className="text-base font-medium text-gray-900">
									{room.slot_duration_minutes} minutes
								</Text>
							</View>
						</View>
					</View>

					{/* Images Section (if we add image URLs later) */}
					{room.image_urls && room.image_urls.length > 0 && (
						<View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-4">
							<Text className="text-xl font-bold text-gray-900 mb-4">
								Room Images
							</Text>
							<Text className="text-sm text-gray-600">
								Images will be displayed here
							</Text>
						</View>
					)}

					{/* Booking Button */}
					{room.status === "active" && (
						<TouchableOpacity
							onPress={() => {
								router.push(`/book-room/${room.id}` as any);
							}}
							className="bg-blue-600 rounded-2xl py-4 items-center shadow-sm"
						>
							<Text className="text-white font-bold text-lg">
								Book This Room
							</Text>
						</TouchableOpacity>
					)}

					{/* Additional Info */}
					<View className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
						<Text className="text-sm text-blue-900">
							💡 Tip: Book early to secure your preferred time slot!
						</Text>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
