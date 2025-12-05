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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = api.getToken()
      if (token) {
        try {
          const currentUser = await api.getCurrentUser()
          setUser(currentUser)
        } catch (error) {
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
    try {
      // Register the user
      await api.register(email, password, "")
      // After successful registration, log them in
      const { access_token } = await api.login(email, password)
      api.setToken(access_token)
      const currentUser = await api.getCurrentUser()
      setUser(currentUser)
      router.push("/dashboard")
    } catch (error) {
      // Re-throw the error so the component can handle it
      throw error
    }
  }

  const logout = () => {
    api.logout()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
