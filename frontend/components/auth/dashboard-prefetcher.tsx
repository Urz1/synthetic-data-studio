"use client"

import { useEffect } from "react"

/**
 * DashboardPrefetcher - Prefetches dashboard resources while user types password
 * 
 * Based on GitHub's approach: "We start fetching the dashboard while the user
 * is still typing the password."
 * 
 * This component:
 * 1. Prefetches the dashboard page (JS/CSS) as low-priority
 * 2. Prefetches dashboard summary data when password field gets focus
 * 3. Only runs on fast connections (skips 2G and data-saver mode)
 */
export function DashboardPrefetcher() {
  useEffect(() => {
    // 1. Prefetch dashboard page (low priority, won't block main thread)
    const prefetchLink = document.createElement("link")
    prefetchLink.rel = "prefetch"
    prefetchLink.href = "/dashboard"
    prefetchLink.as = "document"
    document.head.appendChild(prefetchLink)
    
    // 2. Prefetch data when password field gets focus
    const passwordFields = document.querySelectorAll('input[type="password"]')
    
    const handleFocus = () => {
      // Skip on slow connections or data-saver mode
      const connection = (navigator as any).connection
      if (connection?.effectiveType === "2g" || connection?.saveData) {
        return
      }
      
      // Low priority fetch - will be cached for when user lands on dashboard
      // Using same-origin to include cookies if already logged in
      fetch("/api/dashboard/summary", {
        credentials: "include",
        // Note: fetchPriority not in TS types yet but works in modern browsers
        // @ts-ignore
        priority: "low",
      }).catch(() => {
        // Silently ignore errors - this is just a prefetch optimization
        // User might not be logged in yet, which is expected
      })
    }
    
    // Attach to all password fields (login and register pages)
    passwordFields.forEach((field) => {
      field.addEventListener("focus", handleFocus, { once: true })
    })
    
    // Cleanup
    return () => {
      prefetchLink.remove()
      passwordFields.forEach((field) => {
        field.removeEventListener("focus", handleFocus)
      })
    }
  }, [])
  
  // This component renders nothing - it's purely for side effects
  return null
}
