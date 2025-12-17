"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const effectiveTheme = resolvedTheme === "dark" ? "dark" : "light"

  const toggle = () => {
    setTheme(effectiveTheme === "light" ? "dark" : "light")
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggle} 
      className={cn("relative overflow-hidden", className)}
      aria-label={`Switch to ${effectiveTheme === "light" ? "dark" : "light"} theme`}
    >
      <Sun 
        className={cn(
          "h-4 w-4 absolute transition-all duration-100 ease-out motion-reduce:transition-none",
          effectiveTheme === "light" 
            ? "rotate-0 scale-100 opacity-100" 
            : "rotate-90 scale-0 opacity-0"
        )} 
      />
      <Moon 
        className={cn(
          "h-4 w-4 absolute transition-all duration-100 ease-out motion-reduce:transition-none",
          effectiveTheme === "dark" 
            ? "rotate-0 scale-100 opacity-100" 
            : "-rotate-90 scale-0 opacity-0"
        )} 
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
