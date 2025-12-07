import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"

// STRATEGY 1: Font optimization - preload, swap, subset
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Show fallback immediately, swap when loaded
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
  fallback: ['Courier New', 'monospace'],
})

export const metadata: Metadata = {
  title: "Synth Studio - Privacy-Preserving Synthetic Data",
  description:
    "Generate privacy-preserving synthetic data with differential privacy guarantees. Upload datasets, train generators, and evaluate quality.",
  generator: "v0.app",
  icons: {
    icon: '/FInal_Logo.png',
    apple: '/FInal_Logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d0f" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* STRATEGY 3: Kill the handshake wait */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'} />
        
        {/* Preconnect to CDN (when using assetPrefix) */}
        {process.env.NEXT_PUBLIC_CDN_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_CDN_URL} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_CDN_URL} />
          </>
        )}
        
        {/* STRATEGY 4: Critical CSS preload (Next.js handles this automatically) */}
        {/* Font preload already handled by next/font with preload: true */}
        
        {/* Enable bfcache - no beforeunload/unload handlers */}
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
