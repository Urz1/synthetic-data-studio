"use client"

import { HelpCircle, BookOpen, MessageCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HelpButtonProps {
  className?: string
}

/**
 * HelpButton - Simple help dropdown linking to documentation and support
 */
export function HelpButton({ className }: HelpButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Help menu"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <a 
            href="/help" 
            className="flex items-center cursor-pointer"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Help Center
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a 
            href="https://docs.synthdata.studio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center cursor-pointer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Documentation
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <a 
            href="https://github.com/Urz1/synthetic-data-studio/discussions" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center cursor-pointer"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Community
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">?</kbd> for shortcuts
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
