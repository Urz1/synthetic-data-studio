import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins/two-factor";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Better Auth server-side configuration
 *
 * This handles all authentication on the Next.js server,
 * avoiding cross-domain cookie issues with the FastAPI backend.
 *
 * Required environment variables:
 * - BETTER_AUTH_SECRET: 32+ character secret for encryption
 * - BETTER_AUTH_URL: Base URL of your app (https://www.synthdata.studio)
 * - DATABASE_URL: PostgreSQL connection string
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: Google OAuth credentials
 * - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET: GitHub OAuth credentials
 */

// Create PostgreSQL pool for database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export const auth = betterAuth({
  // Database for storing users and sessions
  database: pool,

  // Base configuration
  // BETTER_AUTH_URL controls the OAuth redirect URLs
  // Fallback is production - set BETTER_AUTH_URL=http://localhost:3000 for local dev
  baseURL: process.env.BETTER_AUTH_URL || "https://www.synthdata.studio",
  secret: process.env.BETTER_AUTH_SECRET,

  // Email and password authentication with bcrypt
  emailAndPassword: {
    enabled: true,
    // Custom bcrypt password hashing to match FastAPI's format
    password: {
      hash: async (password: string) => {
        // Hash with 12 rounds to match FastAPI's bcrypt config
        return bcrypt.hash(password, 12);
      },
      verify: async (data: { hash: string; password: string }) => {
        // Verify bcrypt password hash
        return bcrypt.compare(data.password, data.hash);
      },
    },
  },

  // Social sign-in providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Account linking - allow users to link multiple OAuth providers
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },

  // Advanced settings
  advanced: {
    // Disable __Secure- cookie prefix for HTTP development
    // In production (HTTPS), this is automatically true
    useSecureCookies: process.env.NODE_ENV === "production",
    // Use UUIDs for IDs to match backend requirements
    generateId: () => crypto.randomUUID(),
  },

  // Plugins for extended functionality
  plugins: [
    twoFactor({
      issuer: "Synth Studio",
      // TOTP settings
      totpOptions: {
        digits: 6,
        period: 30,
      },
    }),
  ],
});

// Export types for use in other files
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
