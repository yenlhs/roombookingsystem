import { SupabaseClient } from "@supabase/supabase-js";
import type {
  Booking,
  BookingWithDetails,
  CreateBookingInput,
  UpdateBookingInput,
  CancelBookingInput,
  BookingFilters,
  BookingStatus,
  TimeSlot,
  RoomAvailability,
} from "@workspace/types";

/**
 * BookingService - Handles all booking-related operations
 * Includes conflict detection, availability checking, and time slot generation
 */
export class BookingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all bookings with optional filters
   */
  async getBookings(filters?: BookingFilters): Promise<BookingWithDetails[]> {
    let query = this.supabase
      .from("bookings")
      .select(
        `
        *,
        user:users!bookings_user_id_fkey(id, email, full_name, avatar_url),
        room:rooms!bookings_room_id_fkey(id, name, capacity, operating_hours_start, operating_hours_end)
      `,
      )
      .order("booking_date", { ascending: false })
      .order("start_time", { ascending: false });

    // Apply filters
    if (filters?.room_id) {
      query = query.eq("room_id", filters.room_id);
    }
    if (filters?.user_id) {
      query = query.eq("user_id", filters.user_id);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.start_date) {
      query = query.gte("booking_date", filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte("booking_date", filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    return data as BookingWithDetails[];
  }

  /**
   * Get a single booking by ID with details
   */
  async getBookingById(id: string): Promise<BookingWithDetails> {
    const { data, error } = await this.supabase
      .from("bookings")
      .select(
        `
        *,
        user:users!bookings_user_id_fkey(id, email, full_name, avatar_url),
        room:rooms!bookings_room_id_fkey(id, name, capacity, operating_hours_start, operating_hours_end)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }
    if (!data) {
      throw new Error("Booking not found");
    }

    return data as BookingWithDetails;
  }

  /**
   * Get bookings for current user
   */
  async getMyBookings(filters?: BookingFilters): Promise<BookingWithDetails[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    return this.getBookings({ ...filters, user_id: user.id });
  }

  /**
   * Get upcoming bookings for current user
   */
  async getMyUpcomingBookings(): Promise<BookingWithDetails[]> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await this.supabase
      .from("bookings")
      .select(
        `
        *,
        user:users!bookings_user_id_fkey(id, email, full_name, avatar_url),
        room:rooms!bookings_room_id_fkey(id, name, capacity, operating_hours_start, operating_hours_end)
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .gte("booking_date", today)
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch upcoming bookings: ${error.message}`);
    }

    return data as BookingWithDetails[];
  }

  /**
   * Check if a time slot is available (no conflicts)
   */
  async checkAvailability(
    roomId: string,
    bookingDate: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<boolean> {
    let query = this.supabase
      .from("bookings")
      .select("id, start_time, end_time")
      .eq("room_id", roomId)
      .eq("booking_date", bookingDate)
      .eq("status", "confirmed");

    // Exclude a specific booking (for updates)
    if (excludeBookingId) {
      query = query.neq("id", excludeBookingId);
    }

    const { data: existingBookings, error } = await query;

    if (error) {
      throw new Error(`Failed to check availability: ${error.message}`);
    }

    // Check for time overlap
    const hasConflict = existingBookings.some((booking) => {
      return this.timeSlotsOverlap(
        startTime,
        endTime,
        booking.start_time,
        booking.end_time,
      );
    });

    return !hasConflict;
  }

  /**
   * Helper function to check if two time slots overlap
   */
  private timeSlotsOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const start1Minutes = this.timeToMinutes(start1);
    const end1Minutes = this.timeToMinutes(end1);
    const start2Minutes = this.timeToMinutes(start2);
    const end2Minutes = this.timeToMinutes(end2);

    // Check if intervals overlap
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
  }

  /**
   * Convert time string (HH:mm:ss or HH:mm) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const parts = time.split(":");
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }

  /**
   * Generate available time slots for a room on a specific date
   */
  async getRoomAvailability(
    roomId: string,
    bookingDate: string,
  ): Promise<RoomAvailability> {
    // Get room details
    const { data: room, error: roomError } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      throw new Error("Room not found");
    }

    if (room.status !== "active") {
      throw new Error("Room is not active");
    }

    // Get existing bookings for the date
    const { data: bookings, error: bookingsError } = await this.supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("room_id", roomId)
      .eq("booking_date", bookingDate)
      .eq("status", "confirmed");

    if (bookingsError) {
      throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
    }

    // Generate time slots
    const slots = this.generateTimeSlots(
      room.operating_hours_start,
      room.operating_hours_end,
      room.slot_duration_minutes,
      bookings || [],
    );

    return {
      room_id: roomId,
      booking_date: bookingDate,
      slots,
    };
  }

  /**
   * Generate time slots for a given time range
   */
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    slotDuration: number,
    existingBookings: Array<{ start_time: string; end_time: string }>,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    let currentMinutes = startMinutes;

    while (currentMinutes + slotDuration <= endMinutes) {
      const slotStart = this.minutesToTime(currentMinutes);
      const slotEnd = this.minutesToTime(currentMinutes + slotDuration);

      // Check if slot conflicts with any existing booking
      const isAvailable = !existingBookings.some((booking) =>
        this.timeSlotsOverlap(
          slotStart,
          slotEnd,
          booking.start_time,
          booking.end_time,
        ),
      );

      slots.push({
        start_time: slotStart,
        end_time: slotEnd,
        is_available: isAvailable,
      });

      currentMinutes += slotDuration;
    }

    return slots;
  }

  /**
   * Convert minutes since midnight to time string (HH:mm:ss)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
  }

  /**
   * Create a new booking
   */
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    // Validate that room exists and is active
    const { data: room, error: roomError } = await this.supabase
      .from("rooms")
      .select("id, status")
      .eq("id", input.room_id)
      .single();

    if (roomError || !room) {
      throw new Error("Room not found");
    }

    if (room.status !== "active") {
      throw new Error("Room is not available for booking");
    }

    // Check for conflicts
    const isAvailable = await this.checkAvailability(
      input.room_id,
      input.booking_date,
      input.start_time,
      input.end_time,
    );

    if (!isAvailable) {
      throw new Error(
        "This time slot is already booked. Please choose another time.",
      );
    }

    // Create booking
    const { data, error } = await this.supabase
      .from("bookings")
      .insert({
        user_id: input.user_id,
        room_id: input.room_id,
        booking_date: input.booking_date,
        start_time: input.start_time,
        end_time: input.end_time,
        notes: input.notes || null,
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    return data as Booking;
  }

  /**
   * Update an existing booking
   */
  async updateBooking(input: UpdateBookingInput): Promise<Booking> {
    // Get existing booking
    const { data: existingBooking, error: fetchError } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("id", input.id)
      .single();

    if (fetchError || !existingBooking) {
      throw new Error("Booking not found");
    }

    // If time/date is being changed, check for conflicts
    if (
      input.room_id ||
      input.booking_date ||
      input.start_time ||
      input.end_time
    ) {
      const roomId = input.room_id || existingBooking.room_id;
      const bookingDate = input.booking_date || existingBooking.booking_date;
      const startTime = input.start_time || existingBooking.start_time;
      const endTime = input.end_time || existingBooking.end_time;

      const isAvailable = await this.checkAvailability(
        roomId,
        bookingDate,
        startTime,
        endTime,
        input.id,
      );

      if (!isAvailable) {
        throw new Error(
          "This time slot is already booked. Please choose another time.",
        );
      }
    }

    // Update booking
    const updateData: any = {};
    if (input.room_id) updateData.room_id = input.room_id;
    if (input.booking_date) updateData.booking_date = input.booking_date;
    if (input.start_time) updateData.start_time = input.start_time;
    if (input.end_time) updateData.end_time = input.end_time;
    if (input.status) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes || null;

    const { data, error } = await this.supabase
      .from("bookings")
      .update(updateData)
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }

    return data as Booking;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(input: CancelBookingInput): Promise<Booking> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await this.supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: input.cancelled_by || user.id,
        cancellation_reason: input.cancellation_reason || null,
      })
      .eq("id", input.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }

    return data as Booking;
  }

  /**
   * Delete a booking (admin only)
   */
  async deleteBooking(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete booking: ${error.message}`);
    }
  }

  /**
   * Get booking statistics for a room
   */
  async getRoomBookingStats(roomId: string): Promise<{
    total_bookings: number;
    upcoming_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
  }> {
    const today = new Date().toISOString().split("T")[0];

    // Total bookings
    const { count: total } = await this.supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    // Upcoming bookings
    const { count: upcoming } = await this.supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("status", "confirmed")
      .gte("booking_date", today);

    // Completed bookings
    const { count: completed } = await this.supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("status", "completed");

    // Cancelled bookings
    const { count: cancelled } = await this.supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("status", "cancelled");

    return {
      total_bookings: total || 0,
      upcoming_bookings: upcoming || 0,
      completed_bookings: completed || 0,
      cancelled_bookings: cancelled || 0,
    };
  }

  /**
   * Mark past bookings as completed (utility function)
   */
  async markPastBookingsAsCompleted(): Promise<number> {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:00`;

    // Find confirmed bookings that have ended
    const { data: pastBookings } = await this.supabase
      .from("bookings")
      .select("id")
      .eq("status", "confirmed")
      .or(
        `booking_date.lt.${today},and(booking_date.eq.${today},end_time.lt.${currentTime})`,
      );

    if (!pastBookings || pastBookings.length === 0) {
      return 0;
    }

    // Update to completed
    const { error } = await this.supabase
      .from("bookings")
      .update({ status: "completed" })
      .in(
        "id",
        pastBookings.map((b) => b.id),
      );

    if (error) {
      throw new Error(`Failed to mark bookings as completed: ${error.message}`);
    }

    return pastBookings.length;
  }
}

/**
 * Factory function to create a BookingService instance
 */
export function createBookingService(supabase: SupabaseClient): BookingService {
  return new BookingService(supabase);
}
