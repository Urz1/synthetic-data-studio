import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins/two-factor";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

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
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD: Email configuration
 */

// Create PostgreSQL pool for database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Create email transporter for sending verification/reset emails
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  // If SMTP not configured, log warning and return null (emails won't send)
  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.warn(
      "[Better Auth] SMTP not configured - email verification and password reset will not work. " +
        "Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in your .env file.",
    );
    return null;
  }

  console.log(
    `[Better Auth] SMTP configured: ${smtpHost}:${smtpPort} (user: ${smtpUser})`,
  );

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
};

const transporter = createTransporter();

// Critical: Validate SMTP is configured if email verification is required
const requireEmailVerification = true;
if (requireEmailVerification && !transporter) {
  throw new Error(
    "[Better Auth] FATAL: Email verification is enabled but SMTP is not configured. " +
      "Either set SMTP_HOST, SMTP_USER, SMTP_PASSWORD environment variables, " +
      "or disable email verification by setting requireEmailVerification to false in lib/auth.ts",
  );
}

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
    // Require email verification before allowing login
    // SMTP is validated at startup - app will fail to start if SMTP is missing
    requireEmailVerification: requireEmailVerification,
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
    // Password reset email (stays in emailAndPassword)
    sendResetPassword: transporter
      ? async ({
          user,
          url,
        }: {
          user: { email: string; name?: string };
          url: string;
        }) => {
          console.log(
            `[Better Auth] Attempting to send password reset email to ${user.email}`,
          );
          try {
            const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
            console.log(`[Better Auth] Using From address: ${fromAddress}`);

            await transporter.sendMail({
              from: fromAddress,
              to: user.email,
              subject: "Reset Your Password - Synth Studio",
              text: `Hi ${user.name || "there"},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${url}\n\nIf you didn't request this, you can safely ignore this email.\n\nThis link will expire in 1 hour.\n\nSynth Studio - Synthetic Data Generation Platform`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding: 40px 0;">
                        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                          <tr>
                            <td style="padding: 40px 30px; text-align: center;">
                              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
                              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 10px 0;">Hi ${user.name || "there"},</p>
                              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">We received a request to reset your password. Click the button below to create a new password:</p>
                              <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                  <td style="border-radius: 4px; background-color: #0070f3;">
                                    <a href="${url}" style="display: inline-block; padding: 14px 28px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px;">Reset Password</a>
                                  </td>
                                </tr>
                              </table>
                              <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">If you didn't request this, you can safely ignore this email.</p>
                              <p style="color: #999999; font-size: 12px; line-height: 18px; margin: 10px 0 0 0;">This link will expire in 1 hour.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                              <p style="color: #999999; font-size: 12px; margin: 0;">Synth Studio - Synthetic Data Generation Platform</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
              `,
            });
            console.log(
              `[Better Auth] ✅ Password reset email successfully sent to ${user.email}`,
            );
          } catch (error) {
            console.error(
              "[Better Auth] ❌ Failed to send password reset email:",
              error,
            );
            console.error(
              "[Better Auth] Error details:",
              error instanceof Error ? error.message : String(error),
            );
            throw new Error("Failed to send password reset email");
          }
        }
      : undefined,
  },

  // Email verification configuration
  emailVerification: {
    // Automatically send verification email on signup
    sendOnSignUp: true,
    // Also send on sign-in if email is not verified
    sendOnSignIn: true,
    // Email verification handler (moved from emailAndPassword to here per Better Auth docs)
    sendVerificationEmail: transporter
      ? async ({
          user,
          url,
        }: {
          user: { email: string; name?: string };
          url: string;
        }) => {
          console.log(
            `[Better Auth] Attempting to send verification email to ${user.email}`,
          );
          try {
            const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
            console.log(`[Better Auth] Using From address: ${fromAddress}`);

            await transporter.sendMail({
              from: fromAddress,
              to: user.email,
              subject: "Verify Your Email - Synth Studio",
              text: `Hi ${user.name || "there"},\n\nThanks for signing up! Please verify your email address by clicking the link below:\n\n${url}\n\nIf you didn't create this account, you can safely ignore this email.\n\nSynth Studio - Synthetic Data Generation Platform`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding: 40px 0;">
                        <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                          <tr>
                            <td style="padding: 40px 30px; text-align: center;">
                              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Welcome to Synth Studio!</h2>
                              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 10px 0;">Hi ${user.name || "there"},</p>
                              <p style="color: #666666; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">Thanks for signing up! Please verify your email address by clicking the button below:</p>
                              <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                  <td style="border-radius: 4px; background-color: #0070f3;">
                                    <a href="${url}" style="display: inline-block; padding: 14px 28px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px;">Verify Email</a>
                                  </td>
                                </tr>
                              </table>
                              <p style="color: #999999; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">If you didn't create this account, you can safely ignore this email.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                              <p style="color: #999999; font-size: 12px; margin: 0;">Synth Studio - Synthetic Data Generation Platform</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
              `,
            });
            console.log(
              `[Better Auth] ✅ Verification email successfully sent to ${user.email}`,
            );
          } catch (error) {
            console.error(
              "[Better Auth] ❌ Failed to send verification email:",
              error,
            );
            console.error(
              "[Better Auth] Error details:",
              error instanceof Error ? error.message : String(error),
            );
            throw new Error("Failed to send verification email");
          }
        }
      : undefined,
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
    database: {
      generateId: () => crypto.randomUUID(),
    },
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
