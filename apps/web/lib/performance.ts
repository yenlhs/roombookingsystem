/**
 * Performance monitoring utilities for web vitals and metrics
 */

export function reportWebVitals(metric: {
  id: string;
  name: string;
  label: string;
  value: number;
}) {
  // Log web vitals in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Web Vitals]", metric);
  }

  // In production, you could send to analytics service
  // Example: analytics.track('web-vital', metric);
}

/**
 * Measure performance of async operations
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[Performance] ${name} failed after ${duration.toFixed(2)}ms`,
        error,
      );
    }
    throw error;
  }
}

/**
 * Preconnect to external domains for faster resource loading
 */
export function preconnect(url: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preconnect";
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Prefetch a route for faster navigation
 */
export function prefetchRoute(route: string) {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = route;
  document.head.appendChild(link);
}
