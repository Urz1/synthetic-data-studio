"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, Sparkles, User, Loader2, Lightbulb, RefreshCw } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { ChatMessage } from "@/lib/types"
import { api } from "@/lib/api"

interface AiChatPanelProps {
  open: boolean
  onClose: () => void
  contextGeneratorId?: string
  contextEvaluationId?: string
}

const suggestedPrompts = [
  { label: "What is epsilon?", prompt: "Explain what epsilon means in differential privacy" },
  { label: "Improve my generator", prompt: "How can I improve my generator's utility while maintaining privacy?" },
  { label: "Risk assessment", prompt: "What does a high privacy risk score mean?" },
  { label: "HIPAA compliance", prompt: "Is my synthetic data suitable for HIPAA compliance?" },
]

export function AiChatPanel({ open, onClose, contextGeneratorId, contextEvaluationId }: AiChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI assistant for Synth Studio. I can help you understand privacy metrics, suggest improvements for your generators, or explain evaluation results. How can I assist you?",
    },
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Add placeholder for streaming response
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      let fullResponse = ""

      for await (const chunk of api.chatStream(text, {
        generator_id: contextGeneratorId,
        evaluation_id: contextEvaluationId,
        history: messages.slice(1), // Skip the initial welcome message
      })) {
        fullResponse += chunk

        // Update the last message with accumulated content
        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullResponse,
          }
          return newMessages
        })
      }
    } catch (err) {
      console.error("Chat failed:", err)
      // Remove both user and failed assistant messages
      setMessages((prev) => prev.slice(0, -2))
      // Show fallback message
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          role: "assistant",
          content: "I'm having trouble processing your question right now. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! I'm your AI assistant for Synth Studio. I can help you understand privacy metrics, suggest improvements for your generators, or explain evaluation results. How can I assist you?",
      },
    ])
  }

  const showSuggestions = messages.length === 1

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 z-40 w-[420px] rounded-xl border shadow-2xl transition-all duration-300 glass",
        "flex flex-col overflow-hidden bg-background",
        open ? "opacity-100 translate-y-0 h-[600px] max-h-[calc(100vh-140px)]" : "opacity-0 translate-y-4 h-0 pointer-events-none",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Privacy-aware guidance</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Reset conversation</span>
        </Button>
      </div>

      {/* Context badges */}
      {(contextGeneratorId || contextEvaluationId) && (
        <div className="flex gap-2 px-4 py-2 border-b bg-muted/20 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Context:</span>
          {contextGeneratorId && (
            <Badge variant="secondary" className="text-xs">
              Generator: {contextGeneratorId.slice(0, 8)}
            </Badge>
          )}
          {contextEvaluationId && (
            <Badge variant="secondary" className="text-xs">
              Evaluation: {contextEvaluationId.slice(0, 8)}
            </Badge>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={cn("flex gap-3 items-start", message.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    message.role === "assistant" ? "bg-primary/10" : "bg-muted",
                  )}
                >
                  {message.role === "assistant" ? <Sparkles className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm max-w-[85%] break-words",
                    message.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground",
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_p]:leading-relaxed [&_ul]:my-2 [&_li]:my-1 [&_code]:bg-background/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_strong]:text-foreground">
                      <ReactMarkdown
                        components={{
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span className="font-medium">Try asking:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(item.prompt)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-muted hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-3 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-muted flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="border-t p-3 bg-background flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about privacy, metrics, or generators..."
            className="flex-1"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          AI suggestions • Verify critical decisions
        </p>
      </div>
    </div>
  )
}
