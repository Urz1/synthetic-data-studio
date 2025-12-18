"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { MetricCard } from "@/components/ui/metric-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Database, 
  Zap, 
  FileBarChart, 
  Plus, 
  Settings,
  Calendar,
  User,
  Eye,
  Download,
  Play,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import { api } from "@/lib/api"
import type { Project, Dataset, Generator, Evaluation } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"


export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const id = params?.id as string

  // State
  const [project, setProject] = React.useState<Project | null>(null)
  const [datasets, setDatasets] = React.useState<Dataset[]>([])
  const [generators, setGenerators] = React.useState<Generator[]>([])
  const [evaluations, setEvaluations] = React.useState<Evaluation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { toast } = useToast()

  // Load data
  React.useEffect(() => {
    if (!id) return
    loadProjectData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadProjectData() {
    try {
      setLoading(true)
      setError(null)

      // OPTIMIZED: Single API call instead of 4 separate calls (75% reduction)
      const data = await api.getProjectResources(id)
      
      setProject(data.project)
      setDatasets(data.datasets)
      setGenerators(data.generators)
      setEvaluations(data.evaluations)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to load project:", err);
      }
      setError(err instanceof Error ? err.message : "Failed to load project")
    } finally {
      setLoading(false)
    }
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
  if (error || !project) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error || "Project not found"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title={project.name}
          description={project.description || "No description"}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/projects">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  // Navigate to settings tab by setting URL hash or use tab state
                  const tabsElement = document.querySelector('[value="settings"]') as HTMLButtonElement
                  if (tabsElement) tabsElement.click()
                }}
                title="Project Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <MetricCard
            title="Total Datasets"
            value={datasets.length}
            icon={<Database className="h-5 w-5" />}
            quality="neutral"
          />
          <MetricCard
            title="Generators"
            value={generators.length}
            icon={<Zap className="h-5 w-5" />}
            quality="neutral"
          />
          <MetricCard
            title="Evaluations"
            value={evaluations.length}
            icon={<FileBarChart className="h-5 w-5" />}
            quality="neutral"
          />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <User className="h-3 w-3" />
                <span>{project.owner_id}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="datasets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="datasets">Datasets ({datasets.length})</TabsTrigger>
            <TabsTrigger value="generators">Generators ({generators.length})</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations ({evaluations.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Datasets Tab */}
          <TabsContent value="datasets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Datasets</CardTitle>
                    <CardDescription>All datasets in this project</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/datasets/upload">
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Dataset
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={datasets}
                  columns={[
                    {
                      key: "name",
                      header: "Name",
                      accessor: (row: Dataset) => (
                        <div>
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-muted-foreground">{row.description}</div>
                        </div>
                      ),
                    },
                    {
                      key: "rows",
                      header: "Rows",
                      accessor: (row: Dataset) => row.num_rows?.toLocaleString() || "—",
                    },
                    {
                      key: "size",
                      header: "Size",
                      accessor: (row: Dataset) => 
                        row.size_bytes 
                          ? `${(row.size_bytes / 1024 / 1024).toFixed(1)} MB` 
                          : "—",
                    },
                    {
                      key: "uploaded",
                      header: "Uploaded",
                      accessor: (row: Dataset) => new Date(row.uploaded_at).toLocaleDateString(),
                    },
                  ]}
                  keyExtractor={(row) => row.id}
                  onRowClick={(row) => router.push(`/datasets/${row.id}`)}
                  compact
                  emptyMessage="No datasets yet"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generators Tab */}
          <TabsContent value="generators">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generators</CardTitle>
                    <CardDescription>Synthetic data generators</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/generators/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Generator
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={generators}
                  columns={[
                    {
                      key: "name",
                      header: "Name",
                      accessor: (row: Generator) => row.name,
                    },
                    {
                      key: "type",
                      header: "Type",
                      accessor: (row: Generator) => (
                        <Badge variant="outline">{row.type}</Badge>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status",
                      accessor: (row: Generator) => (
                        <Badge variant={row.status === "completed" ? "default" : "secondary"}>
                          {row.status}
                        </Badge>
                      ),
                    },
                    {
                      key: "created",
                      header: "Created",
                      accessor: (row: Generator) => new Date(row.created_at).toLocaleDateString(),
                    },
                  ]}
                  keyExtractor={(row) => row.id}
                  onRowClick={(row) => router.push(`/generators/${row.id}`)}
                  compact
                  emptyMessage="No generators yet"
                  rowActions={[
                    {
                      label: "View Details",
                      icon: <Eye className="h-4 w-4" />,
                      onClick: (row) => router.push(`/generators/${row.id}`),
                    },
                    {
                      label: "Download Model",
                      icon: <Download className="h-4 w-4" />,
                      onClick: async (row) => {
                        if (row.status !== "completed") {
                          toast({ title: "Not Ready", description: "Generator training must complete first.", variant: "destructive" })
                          return
                        }
                        try {
                          await api.downloadModel(row.id)
                          toast({ title: "Download Started", description: "Model download initiated." })
                        } catch (err) {
                          toast({ title: "Download Failed", description: err instanceof Error ? err.message : "Failed to download", variant: "destructive" })
                        }
                      },
                    },
                    {
                      label: "Run Evaluation",
                      icon: <Play className="h-4 w-4" />,
                      onClick: (row) => {
                        if (row.status !== "completed") {
                          toast({ title: "Not Ready", description: "Generator training must complete before evaluation.", variant: "destructive" })
                          return
                        }
                        router.push(`/evaluations/new?generator_id=${row.id}`)
                      },
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Evaluations</CardTitle>
                    <CardDescription>Quality and privacy assessments</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/evaluations/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Run Evaluation
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={evaluations}
                  columns={[
                    {
                      key: "id",
                      header: "Evaluation ID",
                      accessor: (row: Evaluation) => (
                        <code className="text-xs bg-muted px-2 py-1 rounded">{row.id}</code>
                      ),
                    },
                    {
                      key: "risk_level",
                      header: "Risk Level",
                      accessor: (row: Evaluation) => row.risk_level ? (
                        <Badge variant={row.risk_level === "low" ? "default" : row.risk_level === "medium" ? "secondary" : "destructive"}>
                          {row.risk_level}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      ),
                    },
                    {
                      key: "created",
                      header: "Created",
                      accessor: (row: Evaluation) => new Date(row.created_at).toLocaleDateString(),
                    },
                  ]}
                  keyExtractor={(row) => row.id}
                  onRowClick={(row) => router.push(`/evaluations/${row.id}`)}
                  compact
                  emptyMessage="No evaluations yet"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>Manage project configuration and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project Name</label>
                  <p className="text-sm text-muted-foreground mt-1">{project.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground mt-1">{project.description || "No description"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary">No tags</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  )
}
