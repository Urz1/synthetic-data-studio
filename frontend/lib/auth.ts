import { betterAuth } from "better-auth";
import { Pool } from "pg";

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
});

export const auth = betterAuth({
  // Database for storing users and sessions
  database: pool,

  // Base configuration
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
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
});

// Export types for use in other files
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
