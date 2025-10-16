// Time utility functions

import type { TimeSlot } from '@workspace/types';

/**
 * Format time to HH:mm:ss
 */
export function formatTimeToISO(hours: number, minutes: number, seconds: number = 0): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Parse time string (HH:mm:ss or HH:mm) to components
 */
export function parseTime(timeString: string): { hours: number; minutes: number; seconds: number } {
  const parts = timeString.split(':');
  return {
    hours: parseInt(parts[0], 10),
    minutes: parseInt(parts[1], 10),
    seconds: parts[2] ? parseInt(parts[2], 10) : 0,
  };
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(timeString: string): number {
  const { hours, minutes } = parseTime(timeString);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return formatTimeToISO(hours, mins);
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(timeString: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(timeString) + minutesToAdd;
  return minutesToTime(totalMinutes);
}

/**
 * Check if time1 is before time2
 */
export function isTimeBefore(time1: string, time2: string): boolean {
  return timeToMinutes(time1) < timeToMinutes(time2);
}

/**
 * Check if time1 is after time2
 */
export function isTimeAfter(time1: string, time2: string): boolean {
  return timeToMinutes(time1) > timeToMinutes(time2);
}

/**
 * Check if a time is within a time range (inclusive)
 */
export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

/**
 * Calculate duration in minutes between two times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

/**
 * Generate time slots for a given time range and duration
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let currentTime = startTime;

  while (isTimeBefore(currentTime, endTime)) {
    const slotEnd = addMinutesToTime(currentTime, slotDurationMinutes);

    // Only add slot if it fits within the end time
    if (isTimeBefore(slotEnd, endTime) || slotEnd === endTime) {
      slots.push({
        start_time: currentTime,
        end_time: slotEnd,
        is_available: true, // Default to available, will be updated based on bookings
      });
    }

    currentTime = slotEnd;
  }

  return slots;
}

/**
 * Format time for display (e.g., "09:00" -> "9:00 AM")
 */
export function formatTimeForDisplay(timeString: string): string {
  const { hours, minutes } = parseTime(timeString);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Format time range for display
 */
export function formatTimeRangeForDisplay(startTime: string, endTime: string): string {
  return `${formatTimeForDisplay(startTime)} - ${formatTimeForDisplay(endTime)}`;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = timeToMinutes(end1);
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = timeToMinutes(end2);

  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

/**
 * Validate time string format (HH:mm:ss or HH:mm)
 */
export function isValidTimeFormat(timeString: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
  return timeRegex.test(timeString);
}
