"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Database,
  Rocket,
  TestTube2,
  Layers,
  Workflow,
  ShieldCheck,
  ScrollText,
  CreditCard,
  Sparkles,
  Settings,
  Menu,
  FileOutput,
  LogOut,
  HelpCircle,
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
  { title: "Generators", href: "/generators", icon: Rocket },
  { title: "Evaluations", href: "/evaluations", icon: TestTube2 },
  { title: "Projects", href: "/projects", icon: Layers },
  { title: "Jobs", href: "/jobs", icon: Workflow },
  { title: "Assistant", href: "/assistant", icon: Sparkles },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Help & Docs", href: "https://docs.synthdata.studio", icon: HelpCircle },
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
  const isAdmin = user?.role === "admin"
  const initials = (user?.full_name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader className="flex items-center gap-2 px-3 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-card">
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
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b bg-card/50 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <MobileSidebarTrigger />
          <SidebarTrigger className="hidden md:inline-flex" aria-label="Toggle sidebar" />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Secure synthetic data platform</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main id="app-main" className="flex-1 overflow-auto px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default AppShell
