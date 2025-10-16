import { describe, it, expect } from 'vitest';
import { RoomStatus } from '@workspace/types';
import {
  createRoomSchema,
  updateRoomSchema,
  roomFilterSchema,
} from './room';

describe('Room Validation Schemas', () => {
  describe('createRoomSchema', () => {
    it('should accept valid room data', () => {
      const validData = {
        name: 'Conference Room A',
        description: 'Large conference room with projector',
        capacity: 20,
        amenities: { projector: true, whiteboard: true },
        status: RoomStatus.ACTIVE,
        operating_hours_start: '08:00',
        operating_hours_end: '18:00',
        slot_duration_minutes: 60,
        image_urls: ['https://example.com/image1.jpg'],
      };
      const result = createRoomSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept minimal required fields', () => {
      const validData = {
        name: 'Conference Room B',
        operating_hours_start: '09:00',
        operating_hours_end: '17:00',
      };
      const result = createRoomSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject short room name', () => {
      const invalidData = {
        name: 'A',
        operating_hours_start: '09:00',
        operating_hours_end: '17:00',
      };
      const result = createRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject long room name', () => {
      const invalidData = {
        name: 'a'.repeat(101),
        operating_hours_start: '09:00',
        operating_hours_end: '17:00',
      };
      const result = createRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 100 characters');
      }
    });

    it('should reject negative capacity', () => {
      const invalidData = {
        name: 'Conference Room C',
        capacity: -5,
        operating_hours_start: '09:00',
        operating_hours_end: '17:00',
      };
      const result = createRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject zero capacity', () => {
      const invalidData = {
        name: 'Conference Room D',
        capacity: 0,
        operating_hours_start: '09:00',
        operating_hours_end: '17:00',
      };
      const result = createRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject invalid time format', () => {
      const invalidData = {
        name: 'Conference Room E',
        operating_hours_start: '25:00',
        operating_hours_end: '17:00',
      };
      const result = createRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid time format');
      }
    });

    it('should reject end time before start time', () => {
      const invalidData = {
        name: 'Conference Room F',
        operating_hours_start: '18:00',
        operating_hours_end: '08:00',
      };
      const result = createRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('after start time');
      }
    });

    it('should reject slot duration less than 15 minutes', () => {
      const invalidData = {
        name: 'Conference Room G',
        operating_hours_start: '09:00',
        operating_hours_end: '17:00',
        slot_duration_minutes: 10,
      };
      const result = createRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 15 minutes');
      }
    });

    it('should reject slot duration more than 8 hours', () => {
      const invalidData = {
        name: 'Conference Room H',
        operating_hours_start: '09:00',
        operating_hours_end: '17:00',
        slot_duration_minutes: 500,
      };
      const result = createRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 8 hours');
      }
    });

    it('should reject invalid image URLs', () => {
      const invalidData = {
        name: 'Conference Room I',
        operating_hours_start: '09:00',
        operating_hours_end: '17:00',
        image_urls: ['not-a-valid-url'],
      };
      const result = createRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid image URL');
      }
    });

    it('should accept time with seconds', () => {
      const validData = {
        name: 'Conference Room J',
        operating_hours_start: '09:00:00',
        operating_hours_end: '17:00:00',
      };
      const result = createRoomSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateRoomSchema', () => {
    it('should accept valid update data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Updated Room Name',
        status: RoomStatus.INACTIVE,
      };
      const result = updateRoomSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept partial update with only status', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: RoomStatus.ACTIVE,
      };
      const result = updateRoomSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate time range when both times provided', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        operating_hours_start: '18:00',
        operating_hours_end: '09:00',
      };
      const result = updateRoomSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('after start time');
      }
    });

    it('should not validate time range when only one time provided', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        operating_hours_start: '09:00',
      };
      const result = updateRoomSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('roomFilterSchema', () => {
    it('should accept valid filter data', () => {
      const validData = {
        status: RoomStatus.ACTIVE,
        search: 'conference',
      };
      const result = roomFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty filters', () => {
      const validData = {};
      const result = roomFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept only status filter', () => {
      const validData = {
        status: RoomStatus.INACTIVE,
      };
      const result = roomFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept only search filter', () => {
      const validData = {
        search: 'meeting',
      };
      const result = roomFilterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
