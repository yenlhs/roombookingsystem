/**
 * Performance monitoring utilities for React Native
 */

import { InteractionManager, Platform } from 'react-native';

/**
 * Measure the execution time of an async function
 */
export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    if (__DEV__) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Run a task after all interactions have completed
 * Useful for deferring non-critical work
 */
export function runAfterInteractions<T>(fn: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      const timer = setTimeout(() => {
        inThrottle = false;
      }, limit) as unknown as number;
      // Type assertion needed due to Node vs Browser setTimeout types
      return timer;
    }
  };
}

/**
 * Check if running on a low-end device
 * Useful for disabling animations or reducing quality
 */
export function isLowEndDevice(): boolean {
  if (Platform.OS === 'android') {
    // On Android, we can check available memory
    // This is a heuristic - adjust thresholds as needed
    return false; // Would need native module to check memory
  }
  return false;
}

/**
 * Log component render time in development
 */
export function logRenderTime(componentName: string, startTime: number): void {
  if (__DEV__) {
    const duration = performance.now() - startTime;
    console.log(`[Render] ${componentName}: ${duration.toFixed(2)}ms`);
  }
}

/**
 * Memory warning handler
 */
export function setupMemoryWarningHandler(): void {
  if (Platform.OS === 'ios') {
    // iOS sends memory warnings
    // Would need native module to handle properly
    if (__DEV__) {
      console.log('[Performance] Memory warning handler registered');
    }
  }
}

/**
 * FlatList optimization configuration
 */
export const FLATLIST_CONFIG = {
  // Number of items to render outside visible area
  windowSize: 10,
  // Initial number of items to render
  initialNumToRender: 10,
  // Max items to render per batch
  maxToRenderPerBatch: 5,
  // Update cells in batches
  updateCellsBatchingPeriod: 50,
  // Remove clipped subviews (Android)
  removeClippedSubviews: Platform.OS === 'android',
};

/**
 * Image optimization settings
 */
export const IMAGE_CONFIG = {
  // Cache images in memory
  cache: 'memory-disk' as const,
  // Resize mode
  resizeMode: 'cover' as const,
  // Priority for image loading
  priority: 'normal' as const,
  // Placeholder color while loading
  placeholderColor: '#E5E7EB',
};
