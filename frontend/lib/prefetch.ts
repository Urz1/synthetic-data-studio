/**
 * Client-side prefetch utilities for instant navigation
 * Uses Next.js App Router prefetching with Intersection Observer
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Prefetch link on hover/intersection for instant navigation
 * Production pattern from Vercel, GitHub, Remix
 */
export function usePrefetchOnHover() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch on hover
    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="/"]');
      if (link) {
        const href = link.getAttribute("href");
        if (href) {
          router.prefetch(href);
        }
      }
    };

    document.addEventListener("mouseenter", handleMouseEnter, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("mouseenter", handleMouseEnter, {
        capture: true,
      });
    };
  }, [router]);
}

/**
 * Prefetch visible links using Intersection Observer
 * Aggressive prefetching like GitHub
 */
export function usePrefetchVisible() {
  const router = useRouter();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            const href = link.getAttribute("href");
            if (href && href.startsWith("/")) {
              router.prefetch(href);
              observer.unobserve(link);
            }
          }
        });
      },
      {
        rootMargin: "50px",
      }
    );

    // Observe all internal links
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => observer.observe(link));

    return () => observer.disconnect();
  }, [router]);
}

/**
 * Prefetch critical routes immediately on mount
 * Pattern from Remix
 */
export function usePrefetchCritical(routes: string[]) {
  const router = useRouter();

  useEffect(() => {
    // Prefetch after a short delay to not block initial render
    const timer = setTimeout(() => {
      routes.forEach((route) => router.prefetch(route));
    }, 100);

    return () => clearTimeout(timer);
  }, [router, routes]);
}

/**
 * Prefetch on requestIdleCallback for low-priority routes
 * Used by Vercel for background prefetching
 */
export function usePrefetchIdle(routes: string[]) {
  const router = useRouter();

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const handle = requestIdleCallback(() => {
        routes.forEach((route) => router.prefetch(route));
      });

      return () => cancelIdleCallback(handle);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timer = setTimeout(() => {
        routes.forEach((route) => router.prefetch(route));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [router, routes]);
}

/**
 * Smart prefetch hook combining hover + visible strategies
 * Production-ready pattern
 */
export function useSmartPrefetch() {
  usePrefetchOnHover();
  usePrefetchVisible();
}
