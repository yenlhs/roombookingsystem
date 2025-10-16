import Toast from 'react-native-toast-message';
import { ZodError } from 'zod';

export type ErrorType =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'not_found'
  | 'server'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  originalError?: Error;
}

/**
 * Formats an error into a user-friendly message
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return firstError?.message || 'Validation error';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

/**
 * Determines the error type based on the error object
 */
export function getErrorType(error: unknown): ErrorType {
  if (error instanceof ZodError) {
    return 'validation';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }

    if (
      message.includes('unauthorized') ||
      message.includes('not authenticated')
    ) {
      return 'authentication';
    }

    if (message.includes('forbidden') || message.includes('not allowed')) {
      return 'authorization';
    }

    if (message.includes('not found')) {
      return 'not_found';
    }

    if (message.includes('server error') || message.includes('500')) {
      return 'server';
    }
  }

  // Check for Supabase errors
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    const code = error.code;
    if (code === 'PGRST301') return 'authentication';
    if (code.startsWith('PGRST1')) return 'authorization';
    if (code === 'PGRST116') return 'not_found';
  }

  return 'unknown';
}

/**
 * Converts an unknown error into a structured AppError
 */
export function createAppError(error: unknown): AppError {
  const type = getErrorType(error);
  const message = formatErrorMessage(error);

  return {
    type,
    message,
    details: error,
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Displays an error toast notification
 */
export function showErrorToast(error: unknown, customMessage?: string) {
  const appError = createAppError(error);
  const message = customMessage || appError.message;
  const description = getErrorDescription(appError.type);

  Toast.show({
    type: 'error',
    text1: message,
    text2: description,
    visibilityTime: 5000,
    autoHide: true,
  });
}

/**
 * Displays a success toast notification
 */
export function showSuccessToast(message: string, description?: string) {
  Toast.show({
    type: 'success',
    text1: message,
    text2: description,
    visibilityTime: 3000,
    autoHide: true,
  });
}

/**
 * Displays an info toast notification
 */
export function showInfoToast(message: string, description?: string) {
  Toast.show({
    type: 'info',
    text1: message,
    text2: description,
    visibilityTime: 3000,
    autoHide: true,
  });
}

/**
 * Gets a user-friendly description for each error type
 */
function getErrorDescription(type: ErrorType): string | undefined {
  const descriptions: Record<ErrorType, string | undefined> = {
    network: 'Please check your internet connection and try again.',
    validation: 'Please check your input and try again.',
    authentication: 'Please log in and try again.',
    authorization: 'You do not have permission to perform this action.',
    not_found: 'The requested resource was not found.',
    server: 'A server error occurred. Please try again later.',
    unknown: undefined,
  };

  return descriptions[type];
}

/**
 * Handles API errors and shows appropriate toast messages
 */
export async function handleApiError(error: unknown, action?: string) {
  const appError = createAppError(error);

  // Log errors in development
  if (__DEV__) {
    console.error('API Error:', appError);
  }

  // Show toast notification
  const actionText = action ? ` while ${action}` : '';
  showErrorToast(error, `Error${actionText}`);

  return appError;
}

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  errorMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, errorMessage);
      throw error;
    }
  }) as T;
}
