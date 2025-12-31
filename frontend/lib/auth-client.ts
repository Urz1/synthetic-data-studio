"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client-side configuration
 *
 * This provides React hooks and methods for authentication:
 * - signIn.email() - Email/password sign in
 * - signIn.social({ provider: "google" }) - OAuth sign in
 * - signUp.email() - Registration
 * - signOut() - Logout
 * - useSession() - Get current session
 */

// Create the auth client
const authClient = createAuthClient({
  // Base URL is optional if the auth server is on the same domain
  // This will use /api/auth/* routes
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});

// Export commonly used methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  // Social providers
} = authClient;

// Export the full client for advanced usage
export { authClient };

// Type-safe provider helper
export type SocialProvider = "google" | "github";

/**
 * Helper to initiate social sign-in
 */
export async function signInWithProvider(
  provider: SocialProvider,
  callbackURL = "/dashboard"
) {
  return signIn.social({
    provider,
    callbackURL,
    errorCallbackURL: "/login?error=oauth_failed",
  });
}

/**
 * Helper to sign in with email/password
 */
export async function signInWithEmail(
  email: string,
  password: string,
  callbackURL = "/dashboard"
) {
  return signIn.email({
    email,
    password,
    callbackURL,
  });
}

/**
 * Helper to sign up with email/password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  callbackURL = "/dashboard"
) {
  return signUp.email({
    email,
    password,
    name,
    callbackURL,
  });
}
