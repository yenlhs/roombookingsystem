import { z } from 'zod';
import { RoomStatus } from '@workspace/types';

// Time validation helper
const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/, {
  message: 'Invalid time format. Use HH:mm or HH:mm:ss',
});

// Create room schema
export const createRoomSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Room name must be at least 2 characters')
      .max(100, 'Room name must be less than 100 characters'),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters')
      .optional()
      .or(z.literal('')),
    capacity: z
      .number()
      .int('Capacity must be a whole number')
      .positive('Capacity must be positive')
      .optional(),
    amenities: z.record(z.any()).optional(),
    status: z.nativeEnum(RoomStatus).default(RoomStatus.ACTIVE),
    operating_hours_start: timeSchema,
    operating_hours_end: timeSchema,
    slot_duration_minutes: z
      .number()
      .int('Slot duration must be a whole number')
      .positive('Slot duration must be positive')
      .min(15, 'Slot duration must be at least 15 minutes')
      .max(480, 'Slot duration must be less than 8 hours')
      .default(60),
    image_urls: z.array(z.string().url('Invalid image URL')).optional(),
  })
  .refine(
    (data) => {
      // Validate that end time is after start time
      const startMinutes =
        parseInt(data.operating_hours_start.split(':')[0]) * 60 +
        parseInt(data.operating_hours_start.split(':')[1]);
      const endMinutes =
        parseInt(data.operating_hours_end.split(':')[0]) * 60 +
        parseInt(data.operating_hours_end.split(':')[1]);
      return endMinutes > startMinutes;
    },
    {
      message: 'Operating hours end time must be after start time',
      path: ['operating_hours_end'],
    }
  );

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

// Update room schema (all fields optional except validation)
export const updateRoomSchema = z
  .object({
    id: z.string().uuid('Invalid room ID'),
    name: z
      .string()
      .min(2, 'Room name must be at least 2 characters')
      .max(100, 'Room name must be less than 100 characters')
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters')
      .optional()
      .or(z.literal('')),
    capacity: z
      .number()
      .int('Capacity must be a whole number')
      .positive('Capacity must be positive')
      .optional(),
    amenities: z.record(z.any()).optional(),
    status: z.nativeEnum(RoomStatus).optional(),
    operating_hours_start: timeSchema.optional(),
    operating_hours_end: timeSchema.optional(),
    slot_duration_minutes: z
      .number()
      .int('Slot duration must be a whole number')
      .positive('Slot duration must be positive')
      .min(15, 'Slot duration must be at least 15 minutes')
      .max(480, 'Slot duration must be less than 8 hours')
      .optional(),
    image_urls: z.array(z.string().url('Invalid image URL')).optional(),
  })
  .refine(
    (data) => {
      // Only validate if both times are provided
      if (data.operating_hours_start && data.operating_hours_end) {
        const startMinutes =
          parseInt(data.operating_hours_start.split(':')[0]) * 60 +
          parseInt(data.operating_hours_start.split(':')[1]);
        const endMinutes =
          parseInt(data.operating_hours_end.split(':')[0]) * 60 +
          parseInt(data.operating_hours_end.split(':')[1]);
        return endMinutes > startMinutes;
      }
      return true;
    },
    {
      message: 'Operating hours end time must be after start time',
      path: ['operating_hours_end'],
    }
  );

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

// Room filter schema
export const roomFilterSchema = z.object({
  status: z.nativeEnum(RoomStatus).optional(),
  search: z.string().optional(),
});

export type RoomFilterInput = z.infer<typeof roomFilterSchema>;

// Room ID param schema
export const roomIdSchema = z.object({
  id: z.string().uuid('Invalid room ID'),
});

export type RoomIdParam = z.infer<typeof roomIdSchema>;
