"use client"

import { useState, useRef, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Send, Lightbulb, Search, Code, MessageSquare, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/layout/protected-route"
import { api } from "@/lib/api"
import type { ChatMessage as OriginalChatMessage } from "@/lib/types"

type ChatMessage = OriginalChatMessage & {
  timestamp: string
}

export default function AssistantPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Chat state
  const [message, setMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, isChatLoading])

  // Helper function for suggested questions
  const sendChatMessage = async (question: string) => {
    if (isChatLoading) return
    
    const userMessage: ChatMessage = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setIsChatLoading(true)
    
    // Add placeholder for streaming response
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    }
    setChatMessages(prev => [...prev, assistantMessage])
    
    try {
      let fullResponse = ""
      
      for await (const chunk of api.chatStream(question, {
        history: chatMessages,
      })) {
        fullResponse += chunk
        
        // Update the last message with accumulated content
        setChatMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullResponse
          }
          return newMessages
        })
      }
    } catch (err) {
      // Remove both user and failed assistant messages
      setChatMessages(prev => prev.slice(0, -2))
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to get response",
        variant: "destructive",
      })
    } finally {
      setIsChatLoading(false)
    }
  }
  
  // Metric explainer state
  const [metricQuery, setMetricQuery] = useState("")
  const [metricResult, setMetricResult] = useState<any>(null)
  const [isMetricLoading, setIsMetricLoading] = useState(false)
  
  // Feature generator state
  const [schemaInput, setSchemaInput] = useState("")
  const [generatedFeatures, setGeneratedFeatures] = useState<string[]>([])
  const [isFeaturesLoading, setIsFeaturesLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim() || isChatLoading) return
    
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    }
    
    setChatMessages(prev => [...prev, userMessage])
    const currentMessage = message
    setMessage("")
    setIsChatLoading(true)
    
    // Add placeholder for streaming response
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    }
    setChatMessages(prev => [...prev, assistantMessage])
    
    try {
      let fullResponse = ""
      
      for await (const chunk of api.chatStream(currentMessage, {
        history: chatMessages,
      })) {
        fullResponse += chunk
        
        // Update the last message with accumulated content
        setChatMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullResponse
          }
          return newMessages
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to get response",
        variant: "destructive",
      })
      
      // Remove both messages on error
      setChatMessages(prev => prev.slice(0, -2))
      setMessage(currentMessage) // Restore message for retry
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleExplainMetric = async () => {
    if (!metricQuery.trim() || isMetricLoading) return
    
    setIsMetricLoading(true)
    try {
      const result = await api.explainMetric(metricQuery)
      setMetricResult(result)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to explain metric",
        variant: "destructive",
      })
    } finally {
      setIsMetricLoading(false)
    }
  }

  const handleGenerateFeatures = async () => {
    if (!schemaInput.trim() || isFeaturesLoading) return
    
    setIsFeaturesLoading(true)
    try {
      const result = await api.generateFeatures({ description: schemaInput })
      setGeneratedFeatures(result.features)
      toast({
        title: "Success",
        description: `Generated ${result.features.length} feature suggestions`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate features",
        variant: "destructive",
      })
    } finally {
      setIsFeaturesLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="AI Assistant"
          description="Get intelligent help with synthetic data generation and privacy"
          actions={
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Powered by LLM
            </Badge>
          }
        />

        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <Search className="mr-2 h-4 w-4" />
              Metric Explainer
            </TabsTrigger>
            <TabsTrigger value="pii">
              <Lightbulb className="mr-2 h-4 w-4" />
              PII Detection
            </TabsTrigger>
            <TabsTrigger value="features">
              <Code className="mr-2 h-4 w-4" />
              Feature Generator
            </TabsTrigger>
          </TabsList>

          {/* Chat Interface */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="flex flex-col h-[calc(100vh-280px)] min-h-[500px] max-h-[700px]">
              <CardHeader className="border-b flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Assistant
                    </CardTitle>
                    <CardDescription className="mt-1">Privacy-aware guidance</CardDescription>
                  </div>
                  {chatMessages.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setChatMessages([])}
                    >
                      Clear Chat
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="py-6 space-y-4">
                    {/* Welcome Message */}
                    {chatMessages.length === 0 && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-muted rounded-lg p-4">
                            <p className="text-sm leading-relaxed">
                              Hello! I'm your AI assistant for Synth Studio. I can help you understand privacy metrics, suggest improvements for your generators, or explain evaluation results. How can I assist you?
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <p className="text-xs text-muted-foreground w-full mb-1">Suggested questions:</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendChatMessage("What is epsilon?")}
                              disabled={isChatLoading}
                            >
                              What is epsilon?
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendChatMessage("How can I improve my generator's privacy guarantees?")}
                              disabled={isChatLoading}
                            >
                              Improve my generator
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendChatMessage("What are the privacy risks with my current configuration?")}
                              disabled={isChatLoading}
                            >
                              Risk assessment
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sendChatMessage("How do I ensure HIPAA compliance for healthcare data?")}
                              disabled={isChatLoading}
                            >
                              HIPAA compliance
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chat Messages */}
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {msg.role === "assistant" && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className={`flex-1 ${msg.role === "user" ? "flex justify-end" : ""}`}>
                          <div
                            className={`inline-block max-w-[85%] rounded-lg p-3 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Loading Indicator */}
                    {isChatLoading && (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg p-3 inline-block">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="border-t px-6 py-4 flex-shrink-0 bg-background">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about privacy, metrics, or generators..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !isChatLoading && message.trim()) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={isChatLoading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={isChatLoading || !message.trim()}
                      size="icon"
                    >
                      {isChatLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    AI responses are suggestions. Always verify critical decisions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metric Explainer */}
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metric Explainer</CardTitle>
                <CardDescription>Understand your evaluation metrics in plain language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter metric name (e.g., 'Statistical Similarity')"
                    value={metricQuery}
                    onChange={(e) => setMetricQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleExplainMetric()}
                    disabled={isMetricLoading}
                  />
                  <Button onClick={handleExplainMetric} disabled={isMetricLoading || !metricQuery.trim()}>
                    {isMetricLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {metricResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{metricResult.metric_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">What it means:</p>
                        <p className="text-sm text-muted-foreground">{metricResult.explanation}</p>
                      </div>
                      {metricResult.value_interpretation && (
                        <div>
                          <p className="text-sm font-medium mb-1">Interpretation:</p>
                          <p className="text-sm text-muted-foreground">{metricResult.value_interpretation}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium mb-1">Good values:</p>
                        <p className="text-sm text-muted-foreground">{metricResult.good_values}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1">If score is poor:</p>
                        <p className="text-sm text-muted-foreground">{metricResult.action_if_poor}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!metricResult && !isMetricLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Enter a metric name to get an explanation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PII Detection */}
          <TabsContent value="pii" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered PII Detection</CardTitle>
                <CardDescription>Use LLM to identify sensitive data with enhanced accuracy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    How to use PII Detection:
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
                    <li>Upload a dataset in the Datasets page</li>
                    <li>Open the dataset details page</li>
                    <li>Click "Run PII Detection" or "Enhanced PII Detection"</li>
                    <li>View results with AI-powered recommendations</li>
                  </ol>
                </div>
                <Button className="w-full" onClick={() => window.location.href = '/datasets'}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Go to Datasets
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Generator */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Schema-Based Feature Generator</CardTitle>
                <CardDescription>AI suggests columns and data types for your schema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe your use case (e.g., 'customer database for e-commerce')"
                  rows={4}
                  value={schemaInput}
                  onChange={(e) => setSchemaInput(e.target.value)}
                  disabled={isFeaturesLoading}
                />
                <Button 
                  className="w-full" 
                  onClick={handleGenerateFeatures}
                  disabled={isFeaturesLoading || !schemaInput.trim()}
                >
                  {isFeaturesLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Code className="mr-2 h-4 w-4" />
                      Generate Schema Suggestions
                    </>
                  )}
                </Button>

                {generatedFeatures.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-3">Suggested columns:</p>
                    <div className="space-y-2">
                      {generatedFeatures.map((feature, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <code className="bg-background px-2 py-1 rounded">{feature}</code>
                          <Badge variant="outline">AI Suggested</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedFeatures.length === 0 && !isFeaturesLoading && schemaInput && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Click generate to get AI suggestions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  )
}
