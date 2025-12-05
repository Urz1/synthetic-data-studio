"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Send, Lightbulb, Search, Code, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"

// Mock chat messages
const mockChatHistory = [
  {
    role: "user" as const,
    content: "Can you explain what epsilon means in differential privacy?",
    timestamp: "2024-12-03T14:30:00Z",
  },
  {
    role: "assistant" as const,
    content: "Epsilon (ε) is a key parameter in differential privacy that quantifies the privacy loss. A smaller epsilon means stronger privacy guarantees. For example, ε=1 is considered strong privacy, while ε=10 is weaker but allows for more utility in the synthetic data. In your context, I'd recommend starting with ε between 1-5 for sensitive data.",
    timestamp: "2024-12-03T14:30:05Z",
  },
  {
    role: "user" as const,
    content: "What's a good privacy score for healthcare data?",
    timestamp: "2024-12-03T14:32:00Z",
  },
  {
    role: "assistant" as const,
    content: "For healthcare data (HIPAA-regulated), aim for:\n- Privacy score: > 0.85\n- K-anonymity: ≥ 5\n- L-diversity: ≥ 3\n- Epsilon (if using DP): 1-3\n\nThese thresholds help ensure PHI is adequately protected while maintaining data utility for analytics.",
    timestamp: "2024-12-03T14:32:10Z",
  },
]

const mockMetricExplanations = [
  {
    metric: "Statistical Similarity",
    value: 0.92,
    explanation: "Measures how closely the synthetic data resembles the original data's statistical properties",
    interpretation: "Excellent - synthetic data closely matches original patterns",
  },
  {
    metric: "ML Utility",
    value: 0.88,
    explanation: "Evaluates whether models trained on synthetic data perform similarly to those trained on real data",
    interpretation: "Very Good - models maintain high performance",
  },
  {
    metric: "Privacy Score",
    value: 0.85,
    explanation: "Composite score measuring risk of re-identification and attribute disclosure",
    interpretation: "Good - acceptable privacy risk for most use cases",
  },
]

export default function AssistantPage() {
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [chatMessages, setChatMessages] = useState(mockChatHistory)
  const [metricQuery, setMetricQuery] = useState("")
  const [schemaInput, setSchemaInput] = useState("")

  const handleSendMessage = () => {
    if (!message.trim()) return
    
    // Add user message (mock)
    setChatMessages([...chatMessages, {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    }])
    setMessage("")
    
    // Simulate assistant response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm a mock assistant. In production, I would provide intelligent responses about your synthetic data, privacy concerns, and best practices.",
        timestamp: new Date().toISOString(),
      }])
    }, 1000)
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
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>LLM Chat Assistant</CardTitle>
                <CardDescription>Ask questions about privacy, metrics, and best practices</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything about synthetic data..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
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
                  />
                  <Button>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {mockMetricExplanations.map((item, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{item.metric}</CardTitle>
                          <Badge variant={item.value > 0.85 ? "default" : "secondary"}>
                            {(item.value * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm font-medium mb-1">What it means:</p>
                          <p className="text-sm text-muted-foreground">{item.explanation}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Your score:</p>
                          <p className="text-sm text-muted-foreground">{item.interpretation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm mb-2">Sample columns detected as PII:</p>
                  <div className="space-y-2">
                    {["email_address", "phone_number", "ssn", "address"].map((col) => (
                      <div key={col} className="flex items-center justify-between">
                        <code className="text-xs bg-background px-2 py-1 rounded">{col}</code>
                        <Badge variant="destructive">High Risk</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run Enhanced PII Detection
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
                />
                <Button className="w-full">
                  <Code className="mr-2 h-4 w-4" />
                  Generate Schema Suggestions
                </Button>

                {schemaInput && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-3">Suggested columns:</p>
                    <div className="space-y-2">
                      {["customer_id", "email", "first_name", "last_name", "purchase_date", "total_amount"].map((col) => (
                        <div key={col} className="flex items-center justify-between text-sm">
                          <code className="bg-background px-2 py-1 rounded">{col}</code>
                          <Badge variant="outline">string</Badge>
                        </div>
                      ))}
                    </div>
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
