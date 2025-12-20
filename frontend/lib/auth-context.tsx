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

  // Background silent refresh for access token (rotates current session)
  useEffect(() => {
    if (!user) return

    // Refresh every 10 minutes (token expires in 15)
    // This allows for a "sliding session"
    const interval = setInterval(async () => {
      try {
        await api.refreshSession()
        console.log("Session refreshed silently")
      } catch (err) {
        console.error("Silent refresh failed", err)
        // If refresh fails, we don't logout immediately 
        // because the current access token might still be valid
      }
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

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
    // Hard logout: evict cache, call backend, full page reload
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map(n => caches.delete(n)))
      }
      
      // Call api.logout (which calls /auth/logout)
      await api.logout()
    } catch (err) {
      console.error("Logout error", err)
    } finally {
      // Full page reload to /login - wipes JS heap and prevents Back button issues
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
