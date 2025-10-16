import { z } from 'zod';
import { BookingStatus } from '@workspace/types';

// Time validation helper
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/, {
  message: 'Invalid time format. Use HH:mm or HH:mm:ss',
});

// Date validation helper
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Invalid date format. Use YYYY-MM-DD',
});

// Create booking schema
export const createBookingSchema = z
  .object({
    user_id: z.string().uuid('Invalid user ID'),
    room_id: z.string().uuid('Invalid room ID'),
    booking_date: dateSchema,
    start_time: timeSchema,
    end_time: timeSchema,
    notes: z
      .string()
      .max(500, 'Notes must be less than 500 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      // Validate that end time is after start time
      const startMinutes =
        parseInt(data.start_time.split(':')[0]) * 60 + parseInt(data.start_time.split(':')[1]);
      const endMinutes =
        parseInt(data.end_time.split(':')[0]) * 60 + parseInt(data.end_time.split(':')[1]);
      return endMinutes > startMinutes;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  )
  .refine(
    (data) => {
      // Validate that booking date is not in the past
      const bookingDate = new Date(data.booking_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    },
    {
      message: 'Booking date cannot be in the past',
      path: ['booking_date'],
    }
  );

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Update booking schema
export const updateBookingSchema = z
  .object({
    id: z.string().uuid('Invalid booking ID'),
    user_id: z.string().uuid('Invalid user ID').optional(),
    room_id: z.string().uuid('Invalid room ID').optional(),
    booking_date: dateSchema.optional(),
    start_time: timeSchema.optional(),
    end_time: timeSchema.optional(),
    status: z.nativeEnum(BookingStatus).optional(),
    notes: z
      .string()
      .max(500, 'Notes must be less than 500 characters')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      // Only validate if both times are provided
      if (data.start_time && data.end_time) {
        const startMinutes =
          parseInt(data.start_time.split(':')[0]) * 60 +
          parseInt(data.start_time.split(':')[1]);
        const endMinutes =
          parseInt(data.end_time.split(':')[0]) * 60 + parseInt(data.end_time.split(':')[1]);
        return endMinutes > startMinutes;
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    }
  )
  .refine(
    (data) => {
      // Only validate if booking date is provided
      if (data.booking_date) {
        const bookingDate = new Date(data.booking_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate >= today;
      }
      return true;
    },
    {
      message: 'Booking date cannot be in the past',
      path: ['booking_date'],
    }
  );

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

// Cancel booking schema
export const cancelBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  cancellation_reason: z
    .string()
    .max(500, 'Cancellation reason must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// Booking filter schema
export const bookingFilterSchema = z.object({
  room_id: z.string().uuid('Invalid room ID').optional(),
  user_id: z.string().uuid('Invalid user ID').optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  search: z.string().optional(),
});

export type BookingFilterInput = z.infer<typeof bookingFilterSchema>;

// Get room availability schema
export const getRoomAvailabilitySchema = z.object({
  room_id: z.string().uuid('Invalid room ID'),
  booking_date: dateSchema,
});

export type GetRoomAvailabilityInput = z.infer<typeof getRoomAvailabilitySchema>;

// Booking ID param schema
export const bookingIdSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
});

export type BookingIdParam = z.infer<typeof bookingIdSchema>;
