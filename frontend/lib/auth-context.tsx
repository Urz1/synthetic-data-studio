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
  logout: () => void
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
      let token = api.getToken()

      // If we don't have a client token yet, try to recover it from the
      // httpOnly session cookie via a server-validated endpoint.
      if (!token) {
        try {
          const res = await fetch("/api/auth/session", {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "include",
          })

          if (res.ok) {
            const data = (await res.json()) as { ok: boolean; token?: string; user?: User }
            if (data?.ok && data.token) {
              api.setToken(data.token)
              token = data.token
              if (data.user) {
                setUser(data.user)
                setLoading(false)
                return
              }
            }
          }
        } catch {
          // ignore and fall back to unauthenticated
        }
      }

      if (token) {
        try {
          const currentUser = await api.getCurrentUser()
          setUser(currentUser)
        } catch {
          // Token is invalid, clear it
          api.setToken(null)
        }
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

  const logout = () => {
    api.logout()
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
