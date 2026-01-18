"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import { authClient, useSession, signUp, signIn, signOut } from "./auth-client";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(true);

  // Synchronize Better Auth session with our user state
  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        setUser(session.user as unknown as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    }
  }, [session, isPending]);

  const login = async (email: string, password: string) => {
    const { error } = await signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (error) {
      throw new Error(error.message || "Login failed");
    }

    // Hard redirect to ensure session is picked up
    window.location.replace("/dashboard");
  };

  const register = async (
    email: string,
    password: string,
    name: string = "",
  ) => {
    const { error } = await signUp.email({
      email,
      password,
      name,
      callbackURL: "/dashboard",
    });

    if (error) {
      throw new Error(error.message || "Registration failed");
    }

    // Registration with Better Auth standard setup usually requires verification
    // But we redirect to a verify-email page in the form component usually.
    // If called via context, we just throw or handle accordingly.
  };

  const refreshUser = async () => {
    // Better Auth useSession hook handles this automatically, but we can manually re-fetch
    const { data: newSession } = await authClient.getSession();
    if (newSession?.user) {
      setUser(newSession.user as unknown as User);
    } else {
      setUser(null);
    }
  };

  const logout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.replace("/login");
        },
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
