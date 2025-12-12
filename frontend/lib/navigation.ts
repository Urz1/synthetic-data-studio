/**
 * Navigation utilities with bfcache compatibility
 * Ensures back/forward cache works properly
 */

"use client";

/**
 * Navigate with bfcache support
 * Avoids patterns that break back/forward cache
 */
export function navigateWithCache(url: string) {
  // Use native navigation for bfcache compatibility
  window.location.href = url;
}

/**
 * Check if page was restored from bfcache
 */
export function isBfCacheRestore() {
  return (
    window.performance &&
    window.performance.getEntriesByType &&
    window.performance.getEntriesByType("navigation").length > 0 &&
    (
      window.performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming
    ).type === "back_forward"
  );
}

/**
 * Initialize page - handle bfcache restore
 */
export function initPageWithBfCache(onRestore?: () => void) {
  // Detect bfcache restore
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      // Page was restored from bfcache
      if (process.env.NODE_ENV === "development") {
        console.log("[bfcache] Page restored from cache");
      }
      onRestore?.();
    }
  });

  // Ensure no beforeunload handlers (they break bfcache)
  // Remove any existing beforeunload listeners
  window.onbeforeunload = null;
}

/**
 * Safe way to persist state without breaking bfcache
 * Use sessionStorage instead of in-memory state
 */
export function persistStateForBfCache<T>(key: string, value: T) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[bfcache] Failed to persist state:", e);
    }
  }
}

export function restoreStateFromBfCache<T>(key: string): T | null {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[bfcache] Failed to restore state:", e);
    }
    return null;
  }
}

/**
 * Monitor bfcache eligibility
 * https://web.dev/bfcache/
 */
export function monitorBfCacheEligibility() {
  if (typeof window === "undefined") return;

  window.addEventListener("pagehide", (event) => {
    if (!event.persisted && process.env.NODE_ENV === "development") {
      console.warn("[bfcache] Page not eligible for bfcache");

      // Log reasons (requires Chrome DevTools Protocol)
      if ("getEntriesByType" in performance) {
        const navEntry = performance.getEntriesByType("navigation")[0] as any;
        if (navEntry?.notRestoredReasons) {
          console.warn("[bfcache] Reasons:", navEntry.notRestoredReasons);
        }
      }
    }
  });
}
