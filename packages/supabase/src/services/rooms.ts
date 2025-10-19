import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Room,
  RoomStatus,
  RoomFilters,
  CreateRoomInput,
  UpdateRoomInput,
} from "@workspace/types";

/**
 * Room Service
 * Handles all room-related operations
 */
export class RoomService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all rooms with optional filtering
   */
  async getRooms(filters?: RoomFilters): Promise<Room[]> {
    let query = this.supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply status filter
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    // Apply search filter
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get active rooms only (for regular users)
   */
  async getActiveRooms(): Promise<Room[]> {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get a single room by ID
   */
  async getRoomById(id: string): Promise<Room> {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Room not found");
    }

    return data;
  }

  /**
   * Create a new room (admin only)
   */
  async createRoom(input: CreateRoomInput): Promise<Room> {
    const {
      data: { user },
      error: authError,
    } = await this.supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Ensure times have proper format (HH:mm:ss)
    const operating_hours_start = this.formatTime(input.operating_hours_start);
    const operating_hours_end = this.formatTime(input.operating_hours_end);

    const roomData = {
      name: input.name,
      description: input.description || null,
      capacity: input.capacity || null,
      amenities: input.amenities || null,
      status: input.status || "active",
      operating_hours_start,
      operating_hours_end,
      slot_duration_minutes: input.slot_duration_minutes || 60,
      image_urls: input.image_urls || null,
      created_by: user.id,
    };

    const { data, error } = await this.supabase
      .from("rooms")
      .insert(roomData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Update an existing room (admin only)
   */
  async updateRoom(input: UpdateRoomInput): Promise<Room> {
    const { id, ...updateData } = input;

    // Format times if provided
    if (updateData.operating_hours_start) {
      updateData.operating_hours_start = this.formatTime(
        updateData.operating_hours_start,
      );
    }
    if (updateData.operating_hours_end) {
      updateData.operating_hours_end = this.formatTime(
        updateData.operating_hours_end,
      );
    }

    const { data, error } = await this.supabase
      .from("rooms")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Room not found");
    }

    return data;
  }

  /**
   * Delete a room (admin only)
   * Note: This will fail if there are active bookings due to FK constraints
   */
  async deleteRoom(id: string): Promise<void> {
    const { error } = await this.supabase.from("rooms").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Soft delete - set room status to inactive
   */
  async deactivateRoom(id: string): Promise<Room> {
    const { data, error } = await this.supabase
      .from("rooms")
      .update({ status: "inactive" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Room not found");
    }

    return data;
  }

  /**
   * Activate a room
   */
  async activateRoom(id: string): Promise<Room> {
    const { data, error } = await this.supabase
      .from("rooms")
      .update({ status: "active" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Room not found");
    }

    return data;
  }

  /**
   * Upload room images to Supabase Storage
   * @param roomId - Room ID
   * @param file - File or Blob to upload
   * @param index - Image index (for multiple images)
   * @returns Public URL of uploaded image
   */
  async uploadRoomImage(
    roomId: string,
    file: File | Blob,
    index: number = 0,
  ): Promise<string> {
    const fileExt = file instanceof File ? file.name.split(".").pop() : "jpg";
    const fileName = `${roomId}/image-${index}-${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from("rooms")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = this.supabase.storage.from("rooms").getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Upload multiple room images
   */
  async uploadRoomImages(
    roomId: string,
    files: (File | Blob)[],
  ): Promise<string[]> {
    const uploadPromises = files.map((file, index) =>
      this.uploadRoomImage(roomId, file, index),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete room image from storage
   */
  async deleteRoomImage(imageUrl: string): Promise<void> {
    const path = this.extractPathFromUrl(imageUrl);
    if (!path) {
      throw new Error("Invalid image URL");
    }

    const { error } = await this.supabase.storage.from("rooms").remove([path]);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get room statistics
   */
  async getRoomStats(roomId: string): Promise<{
    total_bookings: number;
    upcoming_bookings: number;
    utilization_rate: number;
  }> {
    const today = new Date().toISOString().split("T")[0];

    // Get total bookings
    const { count: total_bookings } = await this.supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    // Get upcoming bookings
    const { count: upcoming_bookings } = await this.supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .gte("booking_date", today)
      .eq("status", "confirmed");

    // TODO: Calculate utilization rate based on operating hours and bookings
    const utilization_rate = 0; // Placeholder

    return {
      total_bookings: total_bookings || 0,
      upcoming_bookings: upcoming_bookings || 0,
      utilization_rate,
    };
  }

  /**
   * Format time string to HH:mm:ss
   */
  private formatTime(time: string): string {
    // If already in HH:mm:ss format, return as is
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time;
    }

    // If in HH:mm format, add :00
    if (/^\d{1,2}:\d{2}$/.test(time)) {
      const parts = time.split(":");
      const hours = parts[0].padStart(2, "0");
      const minutes = parts[1];
      return `${hours}:${minutes}:00`;
    }

    throw new Error("Invalid time format. Use HH:mm or HH:mm:ss");
  }

  /**
   * Extract file path from storage URL
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split(
        "/storage/v1/object/public/rooms/",
      );
      return pathParts[1] || null;
    } catch {
      return null;
    }
  }
}

/**
 * Create a room service instance
 */
export function createRoomService(supabase: SupabaseClient): RoomService {
  return new RoomService(supabase);
}
