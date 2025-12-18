"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api } from "./api"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  completeOAuthLogin: (token: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      console.log("[Auth] Starting checkAuth...")
      let token = api.getToken()
      console.log("[Auth] Token from api.getToken():", token ? "EXISTS" : "NULL")

      // If we don't have a client token yet, try to recover it from the
      // httpOnly session cookie via a server-validated endpoint.
      if (!token) {
        console.log("[Auth] No token, trying /api/auth/session...")
        try {
          const res = await fetch("/api/auth/session", {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "include",
          })

          console.log("[Auth] /api/auth/session response:", res.status)
          if (res.ok) {
            const data = (await res.json()) as { ok: boolean; token?: string; user?: User }
            if (data?.ok && data.token) {
              api.setToken(data.token)
              token = data.token
              if (data.user) {
                console.log("[Auth] User from session:", data.user.email)
                setUser(data.user)
                setLoading(false)
                return
              }
            }
          }
        } catch (e) {
          console.log("[Auth] Session fetch error:", e)
          // ignore and fall back to unauthenticated
        }
      }

      if (token) {
        console.log("[Auth] Token exists, calling getCurrentUser...")
        try {
          const currentUser = await api.getCurrentUser()
          console.log("[Auth] getCurrentUser success:", currentUser?.email)
          setUser(currentUser)
        } catch (e) {
          console.log("[Auth] getCurrentUser FAILED:", e)
          // Token is invalid, clear it
          api.setToken(null)
        }
      } else {
        console.log("[Auth] No token found, user is unauthenticated")
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const { access_token } = await api.login(email, password)
    api.setToken(access_token)
    const currentUser = await api.getCurrentUser()
    setUser(currentUser)
    router.push("/dashboard")
  }

  const register = async (email: string, password: string) => {
    // Register the user - don't auto-login because email verification is required
    await api.register(email, password, "")
    // Registration successful - user needs to verify email before logging in
    // The caller should redirect to login page with a success message
    throw new Error("REGISTRATION_REQUIRES_VERIFICATION")
  }

  const completeOAuthLogin = async (token: string) => {
    api.setToken(token)
    const currentUser = await api.getCurrentUser()
    setUser(currentUser)
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, completeOAuthLogin }}>
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
