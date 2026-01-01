"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "./api"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated via cookie
    const checkAuth = async () => {
      // Skip on auth pages - they handle their own flow
      if (typeof window !== "undefined") {
        const path = window.location.pathname
        if (path.startsWith("/auth/") || path === "/login" || path === "/register") {
          setLoading(false)
          return
        }

        // Check for prefetched user data (set during login via sessionStorage or OAuth via cookie)
        try {
          // First check sessionStorage (for normal login)
          let prefetched = sessionStorage.getItem("ss_user_prefetch")
          let fromCookie = false

          // If not in sessionStorage, check cookie (for OAuth login)
          if (!prefetched && typeof document !== "undefined") {
            const cookieMatch = document.cookie.match(/ss_user_prefetch=([^;]+)/)
            if (cookieMatch) {
              prefetched = decodeURIComponent(cookieMatch[1])
              fromCookie = true
            }
          }

          if (prefetched) {
            const userData = JSON.parse(prefetched)
            if (userData && userData.id) {
              setUser(userData as User)
              setLoading(false)
              // Clear prefetch
              if (fromCookie) {
                // Delete the cookie by setting expired date
                document.cookie = "ss_user_prefetch=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
              } else {
                sessionStorage.removeItem("ss_user_prefetch")
              }
              // Background validation (don't block)
              api.getCurrentUser().then(validatedUser => {
                setUser(validatedUser)
              }).catch(() => {
                // If validation fails, user cookie is invalid
                setUser(null)
              })
              return
            }
          }
        } catch {
          // Ignore prefetch errors
        }
      }

      try {
        // Fetch current user - cookies are sent automatically
        const currentUser = await api.getCurrentUser()
        setUser(currentUser)
      } catch {
        // Not authenticated or error - that's fine
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Note: Silent refresh removed - the backend handles token refresh via httpOnly refresh cookies
  // The access token is refreshed automatically when requests are made with valid refresh cookies

  const login = async (email: string, password: string) => {
    await api.login(email, password)
    // Cookies are set by backend - hard redirect to dashboard
    window.location.replace("/dashboard")
  }

  const register = async (email: string, password: string) => {
    await api.register(email, password, "")
    // Registration requires email verification
    throw new Error("REGISTRATION_REQUIRES_VERIFICATION")
  }

  const refreshUser = async () => {
    try {
      const currentUser = await api.getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    }
  }

  const logout = async () => {
    // Hard logout: evict cache, call Better Auth signOut, full page reload
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map(n => caches.delete(n)))
      }
      
      // Clear any session storage
      sessionStorage.clear()
      
      // Call Better Auth signOut via our logout endpoint
      // This revokes the session server-side and clears cookies
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error("Logout error", err)
    } finally {
      // Full page reload to /login - wipes JS heap and prevents Back button issues
      // Using replace prevents back button from returning to authenticated pages
      window.location.replace("/login")
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
