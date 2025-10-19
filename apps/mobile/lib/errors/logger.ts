/**
 * Simple logging utility for error tracking
 * In production, this could be integrated with services like Sentry, LogRocket, etc.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
  error?: Error;
}

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error,
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
      error,
    };
  }

  private log(entry: LogEntry) {
    const formattedMessage = this.formatMessage(entry);

    // In development, log to console
    if (this.isDevelopment) {
      switch (entry.level) {
        case "debug":
          console.debug(formattedMessage, entry.data);
          break;
        case "info":
          console.info(formattedMessage, entry.data);
          break;
        case "warn":
          console.warn(formattedMessage, entry.data);
          break;
        case "error":
          console.error(formattedMessage, entry.error || entry.data);
          break;
      }
    }

    // In production, send to logging service
    if (!this.isDevelopment) {
      // TODO: Send to logging service (e.g., Sentry, LogRocket, etc.)
      // Example:
      // if (entry.level === 'error' && entry.error) {
      //   Sentry.captureException(entry.error, {
      //     extra: entry.data,
      //   });
      // }
    }
  }

  debug(message: string, data?: unknown) {
    this.log(this.createEntry("debug", message, data));
  }

  info(message: string, data?: unknown) {
    this.log(this.createEntry("info", message, data));
  }

  warn(message: string, data?: unknown) {
    this.log(this.createEntry("warn", message, data));
  }

  error(message: string, error?: Error, data?: unknown) {
    this.log(this.createEntry("error", message, data, error));
  }
}

export const logger = new Logger();
