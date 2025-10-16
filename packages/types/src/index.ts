// Shared TypeScript types for Room Booking System

// ============================================
// User Types
// ============================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
}

// ============================================
// Room Types
// ============================================

export enum RoomStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface Room {
  id: string;
  name: string;
  description?: string | null;
  capacity?: number | null;
  amenities?: Record<string, any> | null;
  status: RoomStatus;
  operating_hours_start: string; // Format: HH:mm:ss
  operating_hours_end: string; // Format: HH:mm:ss
  slot_duration_minutes: number;
  image_urls?: string[] | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomInput {
  name: string;
  description?: string;
  capacity?: number;
  amenities?: Record<string, any>;
  status?: RoomStatus;
  operating_hours_start: string;
  operating_hours_end: string;
  slot_duration_minutes?: number;
  image_urls?: string[];
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {
  id: string;
}

// ============================================
// Booking Types
// ============================================

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export interface Booking {
  id: string;
  user_id: string;
  room_id: string;
  booking_date: string; // Format: YYYY-MM-DD
  start_time: string; // Format: HH:mm:ss
  end_time: string; // Format: HH:mm:ss
  status: BookingStatus;
  notes?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  user?: User;
  room?: Room;
}

export interface CreateBookingInput {
  user_id: string;
  room_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface UpdateBookingInput extends Partial<CreateBookingInput> {
  id: string;
  status?: BookingStatus;
}

export interface CancelBookingInput {
  id: string;
  cancellation_reason?: string;
  cancelled_by?: string;
}

// ============================================
// Availability Types
// ============================================

export interface TimeSlot {
  start_time: string; // Format: HH:mm:ss
  end_time: string; // Format: HH:mm:ss
  is_available: boolean;
}

export interface RoomAvailability {
  room_id: string;
  booking_date: string;
  slots: TimeSlot[];
}

// ============================================
// Auth Types
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  total_rooms: number;
  total_bookings_today: number;
  total_bookings_week: number;
  total_bookings_month: number;
  active_users: number;
  room_utilization_rate: number;
}

export interface RecentActivity {
  id: string;
  type: 'booking_created' | 'booking_cancelled' | 'user_registered' | 'room_created';
  title: string;
  description: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
}

// ============================================
// Filter & Search Types
// ============================================

export interface BookingFilters {
  room_id?: string;
  user_id?: string;
  status?: BookingStatus;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface UserFilters {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

export interface RoomFilters {
  status?: RoomStatus;
  search?: string;
}

// ============================================
// Database Types (Supabase specific)
// ============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
