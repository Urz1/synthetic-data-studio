"use client"

import * as React from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AiChatPanel } from "@/components/chat/ai-chat-panel"
import { cn } from "@/lib/utils"

export function AiChatButton() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-200",
          "bg-primary hover:bg-primary/90 hover:scale-105",
          open && "rotate-90",
        )}
        size="icon"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        <span className="sr-only">{open ? "Close chat" : "Open AI assistant"}</span>
      </Button>

      {/* Chat panel */}
      <AiChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
