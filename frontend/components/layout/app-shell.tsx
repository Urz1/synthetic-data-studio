"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Database,
  Zap,
  TestTube2,
  FolderOpen,
  Workflow,
  ShieldCheck,
  ScrollText,
  CreditCard,
  MessageSquare,
  Settings,
  Menu,
  FileOutput,
  LogOut,
  HelpCircle,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { cn } from "@/lib/utils"

// Regular user navigation items
const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Datasets", href: "/datasets", icon: Database },
  { title: "Generators", href: "/generators", icon: Zap },
  { title: "Evaluations", href: "/evaluations", icon: TestTube2 },
  { title: "Projects", href: "/projects", icon: FolderOpen },
  { title: "Jobs", href: "/jobs", icon: Workflow },
  { title: "Assistant", href: "/assistant", icon: MessageSquare },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Help & Docs", href: "/help", icon: HelpCircle },
]

// Admin-only navigation items
const adminNavItems = [
  { title: "Exports", href: "/exports", icon: FileOutput },
  { title: "Compliance", href: "/compliance", icon: ShieldCheck },
  { title: "Audit", href: "/audit", icon: ScrollText },
  { title: "Billing", href: "/billing", icon: CreditCard },
]

type AppShellProps = {
  children: React.ReactNode
  user?: { full_name?: string; email?: string; role?: string }
}

function MobileSidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden h-11 w-11"
      onClick={toggleSidebar}
      aria-label="Toggle navigation"
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const isAdmin = user?.role === "admin"
  const initials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      // Logout redirects to landing page, so we don't need to do anything here
    } catch (error) {
      // If logout fails, reset the loading state
      setIsLoggingOut(false)
      console.error("Logout failed:", error)
    }
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border/70">
        <SidebarHeader className="flex items-center gap-3 px-3 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sidebar-border/70 bg-card/60">
            <Image
              src="/FInal_Logo.png"
              alt="Synth Studio"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold">Synth Studio</span>
            <span className="text-xs text-muted-foreground">Privacy-first</span>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 pb-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-[0.2em] text-muted-foreground px-2 mb-2">
              Workspace
            </SidebarGroupLabel>
            <SidebarMenu aria-label="Primary navigation">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname?.startsWith(item.href)
                const isExternal = item.href.startsWith("http")
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      {isExternal ? (
                        <a
                          href={item.href}
                          className="flex items-center gap-3"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex items-center gap-3"
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>

          {/* Admin-only section */}
          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-[0.2em] text-muted-foreground px-2 mb-2">
                Administration
              </SidebarGroupLabel>
              <SidebarMenu aria-label="Admin navigation">
                {adminNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname?.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3"
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="px-3 pb-4">
          <SidebarSeparator className="mb-3" />
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-md border px-3 py-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "Signed in"}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <div className="app-canvas flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-40 border-b bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <div className="mx-auto flex w-full max-w-screen-2xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <MobileSidebarTrigger />
            <SidebarTrigger className="hidden md:inline-flex" aria-label="Toggle sidebar" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Secure synthetic data platform</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden md:flex items-center gap-3 rounded-full border bg-card/60 px-3 py-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-none truncate max-w-[14rem]">{user?.full_name || "User"}</p>
                  <p className="text-[11px] text-muted-foreground leading-none truncate max-w-[14rem]">{user?.email || ""}</p>
                </div>
              </div>
              <Avatar className="h-9 w-9 md:hidden">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <main id="app-main" className="flex-1 overflow-auto px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-screen-2xl space-y-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default AppShell
