"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * TanStack Query Provider
 * 
 * Provides React Query context to the application with optimized defaults:
 * - 5 minute stale time for most data
 * - 30 minute garbage collection
 * - Request deduplication
 * - Background refetching on focus
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient in useState to avoid recreating on every render
  // This is the recommended pattern for Next.js App Router
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache is garbage collected after 30 minutes
            gcTime: 30 * 60 * 1000,
            // Retry failed requests up to 3 times
            retry: 3,
            // Don't refetch on window focus in development
            refetchOnWindowFocus: process.env.NODE_ENV === "production",
            // Deduplicate requests within 2 seconds
            refetchOnMount: false,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
