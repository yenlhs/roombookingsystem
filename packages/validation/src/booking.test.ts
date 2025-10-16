import { describe, it, expect } from 'vitest';
import { BookingStatus } from '@workspace/types';
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  bookingFilterSchema,
  getRoomAvailabilitySchema,
} from './booking';

describe('Booking Validation Schemas', () => {
  describe('createBookingSchema', () => {
    it('should accept valid booking data', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const validData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        room_id: '223e4567-e89b-12d3-a456-426614174000',
        booking_date: dateStr,
        start_time: '09:00',
        end_time: '10:00',
        notes: 'Team meeting',
      };
      const result = createBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid user_id UUID', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const invalidData = {
        user_id: 'not-a-uuid',
        room_id: '223e4567-e89b-12d3-a456-426614174000',
        booking_date: dateStr,
        start_time: '09:00',
        end_time: '10:00',
      };
      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID');
      }
    });

    it('should reject invalid time format', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const invalidData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        room_id: '223e4567-e89b-12d3-a456-426614174000',
        booking_date: dateStr,
        start_time: '25:00',
        end_time: '10:00',
      };
      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid time format');
      }
    });

    it('should reject end time before start time', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const invalidData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        room_id: '223e4567-e89b-12d3-a456-426614174000',
        booking_date: dateStr,
        start_time: '10:00',
        end_time: '09:00',
      };
      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('End time must be after start time');
      }
    });

    it('should reject past booking date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const invalidData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        room_id: '223e4567-e89b-12d3-a456-426614174000',
        booking_date: dateStr,
        start_time: '09:00',
        end_time: '10:00',
      };
      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Booking date cannot be in the past');
      }
    });

    it('should accept today as booking date', () => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      const validData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        room_id: '223e4567-e89b-12d3-a456-426614174000',
        booking_date: dateStr,
        start_time: '09:00',
        end_time: '10:00',
      };
      const result = createBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject notes longer than 500 characters', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const invalidData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        room_id: '223e4567-e89b-12d3-a456-426614174000',
        booking_date: dateStr,
        start_time: '09:00',
        end_time: '10:00',
        notes: 'a'.repeat(501),
      };
      const result = createBookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 500 characters');
      }
    });
  });

  describe('updateBookingSchema', () => {
    it('should accept valid update data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        notes: 'Updated notes',
        status: BookingStatus.CONFIRMED,
      };
      const result = updateBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only status', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: BookingStatus.CANCELLED,
      };
      const result = updateBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate time range when both times provided', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        start_time: '14:00',
        end_time: '13:00',
      };
      const result = updateBookingSchema.safeParse(validData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('End time must be after start time');
      }
    });
  });

  describe('cancelBookingSchema', () => {
    it('should accept valid cancellation data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cancellation_reason: 'Meeting rescheduled',
      };
      const result = cancelBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept cancellation without reason', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };
      const result = cancelBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('bookingFilterSchema', () => {
    it('should accept valid filter data', () => {
      const validData = {
        room_id: '123e4567-e89b-12d3-a456-426614174000',
        status: BookingStatus.CONFIRMED,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      };
      const result = bookingFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty filters', () => {
      const validData = {};
      const result = bookingFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('getRoomAvailabilitySchema', () => {
    it('should accept valid availability check data', () => {
      const validData = {
        room_id: '123e4567-e89b-12d3-a456-426614174000',
        booking_date: '2025-12-25',
      };
      const result = getRoomAvailabilitySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        room_id: '123e4567-e89b-12d3-a456-426614174000',
        booking_date: '25-12-2025',
      };
      const result = getRoomAvailabilitySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid date format');
      }
    });
  });
});
