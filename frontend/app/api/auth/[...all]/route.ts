import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API Route Handler
 *
 * This catch-all route handles all authentication requests:
 * - POST /api/auth/sign-in/email - Email/password sign in
 * - POST /api/auth/sign-up/email - Registration
 * - GET /api/auth/sign-in/social - OAuth initiation
 * - GET /api/auth/callback/* - OAuth callbacks
 * - POST /api/auth/sign-out - Logout
 * - GET /api/auth/session - Get current session
 *
 * All routes are handled automatically by Better Auth.
 */

export const { POST, GET } = toNextJsHandler(auth);
