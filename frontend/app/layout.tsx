import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { QueryProvider } from "@/lib/query-provider"
import { ErrorBoundary } from "@/components/error-boundary"
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
        <meta id="synth-theme-color" name="theme-color" content="#fafbfc" />

        <script
          // Runs before React hydration to avoid a theme flash.
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var root = document.documentElement;
    var stored = localStorage.getItem('theme') || 'system';
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = stored === 'system' ? (prefersDark ? 'dark' : 'light') : stored;
    var isDark = resolved === 'dark';
    root.classList.toggle('dark', isDark);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.style.colorScheme = isDark ? 'dark' : 'light';
    var meta = document.getElementById('synth-theme-color');
    if (meta) meta.setAttribute('content', isDark ? '#0c0d0f' : '#fafbfc');
  } catch (e) {}
})();`,
          }}
        />

        {/* STRATEGY 3: Kill the handshake wait */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'https://api.synthdata.studio'} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || 'https://api.synthdata.studio'} />
        
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
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <QueryProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
