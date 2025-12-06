"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Database,
  FileBarChart,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
  Zap,
  Key,
  HelpCircle,
  ChevronRight,
  Boxes,
  DollarSign,
  Shield,
  FileCheck,
  Sparkles,
  Download,
  Activity,
  Code,
  ChevronDown,
} from "lucide-react"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { AiChatButton } from "@/components/chat/ai-chat-button"

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  description?: string
}

interface NavSection {
  title: string
  items: NavItem[]
  collapsible?: boolean
  defaultOpen?: boolean
}

const navSections: NavSection[] = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview & activity" },
      { label: "Projects", href: "/projects", icon: FolderOpen, description: "Organize your work" },
    ],
  },
  {
    title: "Data",
    items: [
      { label: "Datasets", href: "/datasets", icon: Database, description: "Upload & manage data" },
      { label: "Generators", href: "/generators", icon: Zap, description: "Train synthetic models" },
      { label: "Synthetic Datasets", href: "/synthetic-datasets", icon: Boxes, description: "Generated outputs" },
      { label: "Schema Generator", href: "/generators/schema", icon: Code, description: "No training needed" },
    ],
  },
  {
    title: "Analysis",
    items: [
      { label: "Evaluations", href: "/evaluations", icon: FileBarChart, description: "Quality & privacy" },
    ],
  },
  {
    title: "System",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Billing", href: "/billing", icon: DollarSign, description: "Usage & quotas" },
      { label: "Compliance", href: "/compliance", icon: FileCheck, description: "GDPR, HIPAA, CCPA" },
      { label: "Audit Logs", href: "/audit", icon: Shield, description: "Activity tracking" },
      { label: "Exports", href: "/exports", icon: Download, description: "File downloads" },
      { label: "Jobs", href: "/jobs", icon: Activity, description: "Background tasks" },
      { label: "AI Assistant", href: "/assistant", icon: Sparkles, description: "LLM-powered help" },
    ],
  },
]

interface AppShellProps {
  children: React.ReactNode
  user?: { full_name: string; email: string } | null
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [systemSectionOpen, setSystemSectionOpen] = React.useState(false)

  // Get initials for avatar
  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"

  // Check if any system item is active to auto-open the section
  React.useEffect(() => {
    const systemSection = navSections.find(s => s.title === "System")
    if (systemSection) {
      const isSystemItemActive = systemSection.items.some(
        item => pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
      if (isSystemItemActive) {
        setSystemSectionOpen(true)
      }
    }
  }, [pathname])

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

    const linkContent = (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          sidebarCollapsed && "lg:w-11 lg:justify-center lg:px-0",
        )}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
          )}
        />
        {!sidebarCollapsed && <span className="lg:block">{item.label}</span>}
        {isActive && !sidebarCollapsed && <ChevronRight className="ml-auto h-4 w-4" />}
      </Link>
    )

    if (sidebarCollapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild className="hidden lg:flex">
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex flex-col gap-0.5">
            <span className="font-medium">{item.label}</span>
            {item.description && <span className="text-xs text-muted-foreground">{item.description}</span>}
          </TooltipContent>
        </Tooltip>
      )
    }

    return linkContent
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-xl px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg overflow-hidden">
              <Image 
                                src="/FInal_Logo.png" 
                alt="Synth Studio Logo" 
                width={56} 
                height={56}
                className="object-contain"
              />
            </div>
            <span className="font-semibold tracking-tight">Synth Studio</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 z-50 h-full border-r bg-sidebar/95 backdrop-blur-xl transition-all duration-300 ease-out lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            sidebarCollapsed ? "lg:w-[68px]" : "lg:w-64",
          )}
        >
          {/* Logo */}
          <div
            className={cn(
              "flex h-14 items-center border-b px-4",
              sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-between",
            )}
          >
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden">
                <Image 
                                  src="/FInal_Logo.png" 
                  alt="Synth Studio Logo" 
                  width={48} 
                  height={48}
                  className="object-contain"
                />
              </div>
              {!sidebarCollapsed && <span className="font-semibold tracking-tight lg:block">Synth Studio</span>}
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className={cn("flex flex-col gap-1 p-3 overflow-y-auto h-[calc(100vh-56px-80px)]", sidebarCollapsed && "lg:items-center")}>
            {navSections.map((section) => (
              <div key={section.title} className="mb-4 last:mb-0">
                {!section.collapsible ? (
                  <>
                    <span
                      className={cn(
                        "px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
                        sidebarCollapsed && "lg:hidden",
                      )}
                    >
                      {section.title}
                    </span>
                    <div className="flex flex-col gap-1">
                      {section.items.map(renderNavItem)}
                    </div>
                  </>
                ) : (
                  <Collapsible open={systemSectionOpen} onOpenChange={setSystemSectionOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-between px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground",
                          sidebarCollapsed && "lg:hidden"
                        )}
                      >
                        <span>{section.title}</span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform", systemSectionOpen && "rotate-180")} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col gap-1 mt-1">
                      {section.items.map(renderNavItem)}
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ))}
          </nav>

          {/* Bottom section */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 border-t p-3 bg-sidebar/95 backdrop-blur-xl",
              sidebarCollapsed && "lg:flex lg:flex-col lg:items-center",
            )}
          >
            {/* Collapse toggle - desktop only */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "hidden lg:flex w-full justify-start gap-2 text-muted-foreground hover:text-foreground mb-2",
                sidebarCollapsed && "lg:w-11 lg:justify-center lg:px-0",
              )}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronRight
                className={cn("h-4 w-4 transition-transform", sidebarCollapsed ? "rotate-0" : "rotate-180")}
              />
              {!sidebarCollapsed && <span className="text-sm">Collapse</span>}
            </Button>

            <div className={cn("flex items-center gap-2", sidebarCollapsed ? "lg:flex-col" : "justify-between")}>
              <ThemeToggle />

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2 px-2 hover:bg-accent transition-colors",
                        sidebarCollapsed && "lg:w-11 lg:px-0"
                      )}
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {!sidebarCollapsed && (
                        <div className="flex flex-col items-start min-w-0 lg:block">
                          <span className="text-sm font-medium truncate max-w-[100px]">{user.full_name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[100px]">View profile</span>
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={sidebarCollapsed ? "center" : "end"}
                    side={sidebarCollapsed ? "right" : "top"}
                    className="w-64"
                  >
                    <DropdownMenuLabel className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                          <AvatarFallback className="text-base bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1 min-w-0">
                          <p className="text-sm font-semibold leading-none truncate">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground font-normal truncate">{user.email}</p>
                          <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0 h-4 mt-1">
                            Pro Plan
                          </Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <div className="px-1 py-1">
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/settings" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="text-sm">Settings</span>
                            <span className="text-xs text-muted-foreground">Manage preferences</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/settings?tab=api-keys" className="flex items-center">
                          <Key className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="text-sm">API Keys</span>
                            <span className="text-xs text-muted-foreground">Manage integrations</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="/billing" className="flex items-center">
                          <DollarSign className="mr-2 h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="text-sm">Billing</span>
                            <span className="text-xs text-muted-foreground">Usage & quotas</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator />
                    
                    <div className="px-1 py-1">
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link href="https://docs.synthstudio.ai" target="_blank" className="flex items-center">
                          <HelpCircle className="mr-2 h-4 w-4" />
                          <span className="text-sm">Help & Docs</span>
                        </Link>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => {
                        // In a real app, this would call logout() from useAuth
                        // For now we just redirect to login
                        window.location.href = "/login"
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className={cn("transition-all duration-300", sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-64")}>
          <div className="container mx-auto p-4 md:p-6 max-w-7xl">{children}</div>
        </main>

        {/* Floating AI Chat */}
        <AiChatButton />
      </div>
    </TooltipProvider>
  )
}
