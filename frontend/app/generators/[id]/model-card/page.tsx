"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, AlertCircle, CheckCircle2, Users, Target, Shield, Loader2, Sparkles, FileDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"
import { api } from "@/lib/api"
import type { Generator } from "@/lib/types"

export default function ModelCardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const generatorId = params?.id as string

  const [generator, setGenerator] = React.useState<Generator | null>(null)
  const [modelCard, setModelCard] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!generatorId) return
    loadGeneratorAndCard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatorId])

  async function loadGeneratorAndCard() {
    try {
      setLoading(true)
      setError(null)
      
      // Load generator details
      const gen = await api.getGenerator(generatorId)
      setGenerator(gen)

      // Try to generate model card if we have dataset_id
      if (gen.output_dataset_id) {
        await generateCard(gen.output_dataset_id, generatorId)
      } else {
        setError("No output dataset available for model card generation")
      }
    } catch (err) {
      console.error("Failed to load generator:", err)
      setError(err instanceof Error ? err.message : "Failed to load model card")
    } finally {
      setLoading(false)
    }
  }

  async function generateCard(datasetId: string, genId: string) {
    try {
      setGenerating(true)
      
      // Try to get cached version from S3 first
      const cached = await api.getModelCardCached(genId)
      
      if (cached.cached) {
        // Cached version exists in S3, use it
        toast({
          title: "Model Card Loaded",
          description: "Loaded from S3 cache",
        })
        // The cached response contains download_url, not the actual card data
        // We need to generate it fresh if we need the JSON data for display
        const card = await api.generateModelCardJSON(genId, datasetId)
        if (!card || Object.keys(card).length === 0) {
          throw new Error("LLM service returned empty model card. Please check backend LLM configuration.")
        }
        setModelCard(card)
      } else {
        // No cached version, use freshly generated one
        const card = cached.model_card ? cached : await api.generateModelCardJSON(genId, datasetId)
        
        if (!card || Object.keys(card).length === 0) {
          throw new Error("LLM service returned empty model card. Please check backend LLM configuration.")
        }
        
        setModelCard(card)
        toast({
          title: "Model Card Generated",
          description: "AI-generated model documentation is ready",
        })
      }
    } catch (err) {
      console.error("Failed to generate model card:", err)
      const errorMsg = err instanceof Error ? err.message : "Failed to generate model card"
      setError(errorMsg)
      toast({
        title: "LLM Service Unavailable",
        description: "Model cards require LLM integration. This is a premium feature that needs additional setup.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  async function handleExportPDF() {
    if (!generator?.output_dataset_id) {
      toast({
        title: "Error",
        description: "No dataset available for export",
        variant: "destructive",
      })
      return
    }

    try {
      setExporting(true)
      const result = await api.exportModelCard(
        generatorId,
        generator.output_dataset_id,
        "pdf",
        true
      )
      
      // Open download URL
      if (result.download_url) {
        window.open(result.download_url, '_blank')
        toast({
          title: "Export Started",
          description: "Model card PDF is being downloaded",
        })
      }
    } catch (err) {
      console.error("Failed to export:", err)
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export model card",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "high":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "default",
      medium: "secondary",
      high: "destructive",
    }
    return <Badge variant={variants[severity] || "outline"}>{severity.toUpperCase()}</Badge>
  }

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Error state
  if (error && !modelCard) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push(`/generators/${generatorId}`)}>
            Back to Generator
          </Button>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Show error if modelCard is empty/null after generation
  if (!modelCard || Object.keys(modelCard).length === 0) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Model card is empty. This may be due to a backend LLM issue, missing dataset, or misconfiguration.<br />
              <span className="block mt-2 text-xs text-muted-foreground">Check backend logs and LLM service status.</span>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={() => generateCard(generator?.output_dataset_id || "", generatorId)} disabled={generating || !generator?.output_dataset_id}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Regenerate
            </Button>
            <Button onClick={() => router.push(`/generators/${generatorId}`)}>
              Back to Generator
            </Button>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  const card = modelCard

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Model Card"
          description={`AI-generated documentation ${generator ? `for ${generator.name}` : ''}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/generators/${generatorId}`}>Back to Generator</Link>
              </Button>
              <Button onClick={handleExportPDF} disabled={exporting}>
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Export PDF
              </Button>
            </div>
          }
        />

        {generating && (
          <Alert className="mb-4">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Generating AI-powered model documentation...
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        {card?.model_details && (card.model_details.name || card.model_details.description || card.model_details.type || card.model_details.developed_by || card.model_details.developed_date) && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  {card.model_details.name && (
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {card.model_details.name}
                    </CardTitle>
                  )}
                  {card.model_details.description && (
                    <CardDescription className="mt-2">{card.model_details.description}</CardDescription>
                  )}
                </div>
                {card.model_details.version && (
                  <Badge variant="outline">v{card.model_details.version}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {card.model_details.type && (
                  <div>
                    <p className="text-muted-foreground">Model Type</p>
                    <p className="font-medium">{card.model_details.type}</p>
                  </div>
                )}
                {card.model_details.developed_by && (
                  <div>
                    <p className="text-muted-foreground">Developed By</p>
                    <p className="font-medium">{card.model_details.developed_by}</p>
                  </div>
                )}
                {card.model_details.developed_date && (
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(card.model_details.developed_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {(card?.intended_use?.primary_uses?.length > 0 || card?.intended_use?.intended_users?.length > 0 || card?.intended_use?.out_of_scope?.length > 0) && (
          <Tabs defaultValue="intended-use" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              {card?.intended_use?.primary_uses?.length > 0 && <TabsTrigger value="intended-use">Intended Use</TabsTrigger>}
              {card?.intended_use?.intended_users?.length > 0 && <TabsTrigger value="users">Intended Users</TabsTrigger>}
              {card?.intended_use?.out_of_scope?.length > 0 && <TabsTrigger value="out-of-scope">Out of Scope</TabsTrigger>}
            </TabsList>

            {/* Intended Use */}
            {card?.intended_use?.primary_uses?.length > 0 && (
              <TabsContent value="intended-use" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Primary Uses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {card.intended_use.primary_uses.map((use: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{use}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {/* Intended Users */}
            {card?.intended_use?.intended_users?.length > 0 && (
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Intended Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {card.intended_use.intended_users.map((user: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{user}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {/* Out of Scope */}
            {card?.intended_use?.out_of_scope?.length > 0 && (
              <TabsContent value="out-of-scope" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      Out of Scope
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {card.intended_use.out_of_scope.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}
