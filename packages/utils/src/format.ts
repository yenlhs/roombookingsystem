// Formatting utility functions

/**
 * Format a phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX for 10 digit numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Return as-is for other formats
  return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a random color hex code
 */
export function generateRandomColor(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;
}

/**
 * Pluralize a word based on count
 */
export function pluralize(
  word: string,
  count: number,
  suffix: string = "s",
): string {
  return count === 1 ? word : `${word}${suffix}`;
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} ${pluralize("minute", diffMin)} ago`;
  if (diffHour < 24) return `${diffHour} ${pluralize("hour", diffHour)} ago`;
  if (diffDay < 7) return `${diffDay} ${pluralize("day", diffDay)} ago`;
  if (diffDay < 30)
    return `${Math.floor(diffDay / 7)} ${pluralize("week", Math.floor(diffDay / 7))} ago`;
  if (diffDay < 365)
    return `${Math.floor(diffDay / 30)} ${pluralize("month", Math.floor(diffDay / 30))} ago`;
  return `${Math.floor(diffDay / 365)} ${pluralize("year", Math.floor(diffDay / 365))} ago`;
}

/**
 * Create a URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Mask email address (e.g., "john@example.com" -> "j***@example.com")
 */
export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (name.length <= 1) return email;
  return `${name[0]}${"*".repeat(name.length - 1)}@${domain}`;
}

/**
 * Mask phone number (e.g., "1234567890" -> "***-***-7890")
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) return phone;
  return `***-***-${cleaned.slice(-4)}`;
}
