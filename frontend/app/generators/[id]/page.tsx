"use client"
import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/ui/status-badge"
import { 
  ArrowLeft, 
  Download, 
  Play, 
  Trash2, 
  Database,
  FileBarChart,
  Loader2,
  Lock,
  Clock
} from "lucide-react"
import { api } from "@/lib/api"
import type { Generator, Dataset, Evaluation, Project } from "@/lib/types"
import ProtectedRoute from "@/components/layout/protected-route"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"

export default function GeneratorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params?.id as string

  // State
  const [generator, setGenerator] = React.useState<Generator | null>(null)
  const [dataset, setDataset] = React.useState<Dataset | null>(null)
  const [evaluations, setEvaluations] = React.useState<Evaluation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [generateDialogOpen, setGenerateDialogOpen] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const [numRows, setNumRows] = React.useState("1000")
  const [datasetName, setDatasetName] = React.useState("")
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedProject, setSelectedProject] = React.useState<string>("")
  const { toast } = useToast()
  const [downloadingModelCard, setDownloadingModelCard] = React.useState<string | null>(null)
  const [downloadingPrivacyReport, setDownloadingPrivacyReport] = React.useState<string | null>(null)
  const [exportingModel, setExportingModel] = React.useState(false)
  const [downloadingSyntheticData, setDownloadingSyntheticData] = React.useState(false)

  // Computed: disable all LLM buttons when any LLM operation is active
  const isAnyLLMOperationActive = Boolean(downloadingModelCard || downloadingPrivacyReport)

  // Load data
  React.useEffect(() => {
    if (!id) return
    loadGeneratorDetails()
    loadProjects()

    // Poll for status updates if active
    const interval = setInterval(() => {
      // Skip polling if tab is hidden
      if (document.hidden) return
      if (generator && ["queued", "running", "generating"].includes(generator.status.toLowerCase())) {
        loadGeneratorDetails(true) // silent refresh
      }
    }, 3000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, generator?.status])

  async function loadProjects() {
    try {
      const data = await api.listProjects()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load projects:", err)
    }
  }

  async function loadGeneratorDetails(silent = false) {
    try {
      if (!silent) {
        setLoading(true)
        setError(null)
      }

      // OPTIMIZED: Single API call for generator + dataset + evaluations
      const data = await api.getGeneratorDetails(id)
      
      setGenerator(data.generator)
      setDataset(data.dataset)
      setEvaluations(data.evaluations)
    } catch (err) {
      console.error("Failed to load generator:", err)
      if (!silent) setError(err instanceof Error ? err.message : "Failed to load generator")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function handleGenerateData() {
    if (!numRows || parseInt(numRows) < 1) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of rows (minimum 1)",
        variant: "destructive",
      })
      return
    }

    if (!datasetName.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a dataset name",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const response = await api.startGeneration(id, {
        numRows: parseInt(numRows),
        datasetName: datasetName.trim(),
        projectId: selectedProject || undefined,
      })
      toast({
        title: "Generation Started",
        description: `Job created: ${response.job_id}`,
      })
      setGenerateDialogOpen(false)
      
      // Navigate to jobs page to see progress
      router.push("/jobs")
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Failed to start generation",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  async function handleExportModel() {
    if (generator?.status !== 'completed') {
      toast({
        title: "Model Not Ready",
        description: "Generator must be completed before exporting the model.",
        variant: "destructive",
      })
      return
    }

    setExportingModel(true)
    try {
      const result = await api.downloadModel(id)
      if (result.download_url) {
        window.open(result.download_url, '_blank')
        toast({
          title: "Download Started",
          description: "Model file is being downloaded",
        })
      } else {
        toast({
          title: "Download Unavailable",
          description: "Model download URL not available. Contact admin.",
        })
      }
    } catch (err) {
      toast({
        title: "Export Failed",
        description: err instanceof Error ? err.message : "Failed to export model",
        variant: "destructive",
      })
    } finally {
      setExportingModel(false)
    }
  }

  async function handleDownloadSyntheticData() {
    if (!generator?.output_dataset_id) {
      toast({
        title: "No Data Available",
        description: "This generator has not produced any synthetic data yet.",
        variant: "destructive",
      })
      return
    }

    setDownloadingSyntheticData(true)
    toast({
      title: "Preparing download...",
      description: "Generating download link",
    })

    try {
      const result = await api.downloadDataset(generator.output_dataset_id)
      
      if (result.download_url) {
        // Trigger browser download
        const link = document.createElement('a')
        link.href = result.download_url
        link.download = result.filename || `${generator.name}_synthetic.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Download complete",
          description: `${result.filename || 'Synthetic data'} saved`,
        })
      } else {
        toast({
          title: "Download unavailable",
          description: "Could not generate download link. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Download failed – please try again",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setDownloadingSyntheticData(false)
    }
  }

  async function handleDownloadModelCard(format: 'pdf' | 'docx' | 'json') {
    if (!generator?.output_dataset_id) return

    try {
      setDownloadingModelCard(format)

      if (format === 'json') {
        // Download JSON directly
        const data = await api.generateModelCardJSON(id, generator.output_dataset_id)
        const dataStr = JSON.stringify(data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `model-card-${generator.name || id.slice(0, 8)}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Download PDF or DOCX from S3
        const result = await api.exportModelCard(
          id, // generator_id
          generator.output_dataset_id, // dataset_id
          format,
          true // save to S3
        )
        
        if (result.download_url) {
          window.open(result.download_url, '_blank')
        }
      }

      toast({
        title: "Download Started",
        description: `Model card ${format.toUpperCase()} is being downloaded`,
      })
    } catch (err) {
      console.error("Failed to download model card:", err)
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : "Failed to download model card. Please ensure backend LLM service is configured.",
        variant: "destructive",
      })
    } finally {
      setDownloadingModelCard(null)
    }
  }

  async function handleDownloadPrivacyReport(format: 'pdf' | 'docx' | 'json') {
    if (!generator?.output_dataset_id) return

    try {
      setDownloadingPrivacyReport(format)

      if (format === 'json') {
        // Download JSON directly
        const data = await api.generatePrivacyReportJSON(generator.output_dataset_id, id)
        const dataStr = JSON.stringify(data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `privacy-report-${generator.name || id.slice(0, 8)}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Download PDF or DOCX from S3
        const result = await api.exportPrivacyReport(
          generator.output_dataset_id, // dataset_id
          id, // generator_id
          format,
          true // save to S3
        )
        
        if (result.download_url) {
          window.open(result.download_url, '_blank')
        }
      }

      toast({
        title: "Download Started",
        description: `Privacy report ${format.toUpperCase()} is being downloaded`,
      })
    } catch (err) {
      console.error("Failed to download privacy report:", err)
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : "Failed to download privacy report. Please ensure backend LLM service is configured.",
        variant: "destructive",
      })
    } finally {
      setDownloadingPrivacyReport(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <div className="flex items-center justify-center py-12" role="status" aria-live="polite" aria-busy="true">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="sr-only">Loading generator details</span>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  // Error state
  if (error || !generator) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || "Generator not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/generators")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generators
          </Button>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/generators">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Generators
            </Link>
          </Button>
        </div>

        <PageHeader
          title={generator.name}
          description={`Type: ${generator.type || 'Unknown'} • Created ${generator.created_at ? new Date(generator.created_at).toLocaleDateString() : 'Unknown'}`}
          actions={
            <div className="flex items-center gap-2">
              {/* Download Synthetic Data Button */}
              {generator.output_dataset_id && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadSyntheticData} 
                  disabled={downloadingSyntheticData}
                >
                  {downloadingSyntheticData ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {downloadingSyntheticData ? 'Downloading...' : 'Download Data'}
                </Button>
              )}
              <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    disabled={generator.status.toLowerCase() !== 'ready'}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Generate Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Synthetic Data</DialogTitle>
                    <DialogDescription>
                      Create synthetic data using this trained model
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="datasetName">Dataset Name *</Label>
                      <Input
                        id="datasetName"
                        type="text"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        placeholder="my_synthetic_data"
                      />
                      <p className="text-xs text-muted-foreground">
                        Name for the generated synthetic dataset
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectSelect">Project (Optional)</Label>
                      <Select
                        value={selectedProject}
                        onValueChange={setSelectedProject}
                      >
                        <SelectTrigger id="projectSelect">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Organize this dataset in a project
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numRows">Number of Rows *</Label>
                      <Input
                        id="numRows"
                        type="number"
                        min="1"
                        max="100000"
                        value={numRows}
                        onChange={(e) => setNumRows(e.target.value)}
                        placeholder="1000"
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of synthetic records to generate (1-100,000)
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setGenerateDialogOpen(false)}
                      disabled={generating}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleGenerateData} disabled={generating}>
                      {generating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations ({evaluations.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generator Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <StatusBadge status={generator.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="outline">{generator.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Source Dataset</span>
                      {dataset ? (
                        <Link href={`/datasets/${dataset.id}`} className="text-sm text-primary hover:underline">
                          {dataset.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unknown</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm">{generator.created_at ? new Date(generator.created_at).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileBarChart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{evaluations.length} Evaluations</span>
                    </div>
                    {dataset && (
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{dataset.row_count?.toLocaleString() || 0} Training Rows</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Model Card</CardTitle>
                    <CardDescription className="text-xs">AI-generated documentation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start" 
                      onClick={() => handleDownloadModelCard('pdf')}
                      disabled={!generator.output_dataset_id || isAnyLLMOperationActive}
                    >
                      {downloadingModelCard === 'pdf' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start" 
                      onClick={() => handleDownloadModelCard('docx')}
                      disabled={!generator.output_dataset_id || isAnyLLMOperationActive}
                    >
                      {downloadingModelCard === 'docx' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download DOCX
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start" 
                      onClick={() => handleDownloadModelCard('json')}
                      disabled={!generator.output_dataset_id || isAnyLLMOperationActive}
                    >
                      {downloadingModelCard === 'json' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download JSON
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Privacy Report</CardTitle>
                    <CardDescription className="text-xs">AI-generated compliance analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start" 
                      onClick={() => handleDownloadPrivacyReport('pdf')}
                      disabled={!generator.output_dataset_id || isAnyLLMOperationActive}
                    >
                      {downloadingPrivacyReport === 'pdf' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start" 
                      onClick={() => handleDownloadPrivacyReport('docx')}
                      disabled={!generator.output_dataset_id || isAnyLLMOperationActive}
                    >
                      {downloadingPrivacyReport === 'docx' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download DOCX
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start" 
                      onClick={() => handleDownloadPrivacyReport('json')}
                      disabled={!generator.output_dataset_id || isAnyLLMOperationActive}
                    >
                      {downloadingPrivacyReport === 'json' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Download JSON
                    </Button>
                    {!generator.output_dataset_id && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Generate data first to download reports
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training">
            <Card>
              <CardHeader>
                <CardTitle>Training Configuration</CardTitle>
                <CardDescription>Parameters used to train this generator</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {generator.parameters_json && typeof generator.parameters_json === 'object' ? (
                    Object.entries(generator.parameters_json).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-muted-foreground">{key}</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{JSON.stringify(value)}</code>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No training parameters available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Privacy Configuration
                </CardTitle>
                <CardDescription>Differential privacy settings</CardDescription>
              </CardHeader>
              <CardContent>
                {generator.privacy_config && typeof generator.privacy_config === 'object' ? (
                  <div className="space-y-4">
                    {Object.entries(generator.privacy_config).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{JSON.stringify(value)}</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No privacy configuration available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations">
            <Card>
              <CardHeader>
                <CardTitle>Quality Evaluations</CardTitle>
                <CardDescription>Assessment results for this generator</CardDescription>
              </CardHeader>
              <CardContent>
                {evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {evaluations.map((evaluation) => (
                      <Card key={evaluation.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Evaluation {evaluation.id?.slice(0, 8) || 'N/A'}</CardTitle>
                            <span className="text-xs text-muted-foreground">
                              {evaluation.created_at ? new Date(evaluation.created_at).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button variant="outline" size="sm" asChild className="w-full">
                            <Link href={`/evaluations/${evaluation.id}`}>
                              View Report
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileBarChart className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">No evaluations yet</p>
                    <Button asChild>
                      <Link href={`/evaluations/new?generator=${generator.id}`}>
                        Run Evaluation
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Danger Zone */}
        <Card className="mt-6 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Generator
            </Button>
            
            <DeleteConfirmationDialog
              entityType="Generator"
              entityName={generator.name}
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onConfirm={async () => {
                try {
                  setIsDeleting(true)
                  toast({
                    title: `Deleting ${generator.name}...`,
                    description: "Please wait while the generator is being removed.",
                  })
                  await api.deleteGenerator(id)
                  toast({
                    title: "Generator deleted",
                    description: `${generator.name} has been permanently removed.`,
                  })
                  router.push("/generators")
                } catch (err) {
                  toast({
                    title: `Could not delete ${generator.name}`,
                    description: "Please try again.",
                    variant: "destructive",
                  })
                } finally {
                  setIsDeleting(false)
                  setDeleteDialogOpen(false)
                }
              }}
              isDeleting={isDeleting}
            />
          </CardContent>
        </Card>
      </AppShell>
    </ProtectedRoute>
  )
}
