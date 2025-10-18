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
  is_exclusive: boolean;
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
  is_exclusive?: boolean;
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
// Subscription Types
// ============================================

export enum SubscriptionTierName {
  FREE = 'free',
  PREMIUM = 'premium',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  UNPAID = 'unpaid',
}

export interface SubscriptionTierFeatures {
  exclusive_rooms: boolean;
  max_concurrent_bookings?: number;
}

export interface SubscriptionTier {
  id: string;
  name: SubscriptionTierName;
  display_name: string;
  description?: string | null;
  price_monthly: number;
  stripe_price_id?: string | null;
  features: SubscriptionTierFeatures;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier_id: string;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  status: SubscriptionStatus;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionWithTier extends UserSubscription {
  tier?: SubscriptionTier;
}

export enum SubscriptionEventType {
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  TRIAL_STARTED = 'trial_started',
  TRIAL_ENDED = 'trial_ended',
}

export interface SubscriptionEvent {
  id: string;
  user_id?: string | null;
  subscription_id?: string | null;
  event_type: SubscriptionEventType;
  stripe_event_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateCheckoutSessionInput {
  tier_id: string;
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
  tier: {
    name: string;
    display_name: string;
    price_monthly: number;
  };
}

export interface CreatePortalSessionInput {
  return_url?: string;
}

export interface PortalSessionResponse {
  url: string;
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
      subscription_tiers: {
        Row: SubscriptionTier;
        Insert: Omit<SubscriptionTier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SubscriptionTier, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_subscriptions: {
        Row: UserSubscription;
        Insert: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>>;
      };
      subscription_events: {
        Row: SubscriptionEvent;
        Insert: Omit<SubscriptionEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<SubscriptionEvent, 'id' | 'created_at'>>;
      };
    };
  };
}
