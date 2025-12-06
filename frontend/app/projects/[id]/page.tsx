"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { MetricCard } from "@/components/ui/metric-card"
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
  Play
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import type { Dataset, Generator, Evaluation } from "@/lib/types"

// Mock project data
const mockProject = {
  id: "proj-1",
  name: "Healthcare Analytics",
  description: "Patient records and clinical trial data synthesis with HIPAA compliance",
  created_at: "2024-11-15T10:00:00Z",
  updated_at: "2024-12-03T14:30:00Z",
  created_by: "user1",
  tags: ["healthcare", "hipaa", "clinical"],
}

const mockDatasets: Dataset[] = [
  {
    id: "ds-1",
    project_id: "proj-1",
    name: "patient_records.csv",
    description: "De-identified patient clinical records",
    file_path: "/uploads/patient_records.csv",
    size_bytes: 15400000,
    num_rows: 50000,
    row_count: 50000,
    schema_data: {
      columns: ["patient_id", "age", "diagnosis", "treatment"],
      dtypes: { "patient_id": "string", "age": "integer", "diagnosis": "string", "treatment": "string" },
    },
    status: "profiled",
    checksum: "abc123def456",
    version: 1,
    uploader_id: "user1",
    uploaded_at: "2024-11-15T10:30:00Z",
  },
  {
    id: "ds-2",
    project_id: "proj-1",
    name: "clinical_trials.csv",
    description: "Phase III clinical trial outcomes",
    file_path: "/uploads/clinical_trials.csv",
    size_bytes: 8200000,
    num_rows: 12000,
    row_count: 12000,
    schema_data: {
      columns: ["trial_id", "drug_name", "outcome", "participant_count"],
      dtypes: { "trial_id": "string", "drug_name": "string", "outcome": "string", "participant_count": "integer" },
    },
    status: "profiled",
    checksum: "xyz789ghi012",
    version: 1,
    uploader_id: "user1",
    uploaded_at: "2024-11-20T14:00:00Z",
  },
]

const mockGenerators: Generator[] = [
  {
    id: "gen-1",
    dataset_id: "ds-1",
    name: "Patient Records Generator",
    type: "dp-ctgan",
    status: "completed",
    parameters_json: { epochs: 300, batch_size: 500 },
    privacy_config: { use_differential_privacy: true, target_epsilon: 8.5, target_delta: 1e-5 },
    privacy_spent: { epsilon: 8.2, delta: 9.5e-6 },
    training_metadata: { duration_seconds: 1842, final_loss: 0.023 },
    created_by: "user1",
    created_at: "2024-12-01T10:00:00Z",
    updated_at: "2024-12-01T12:00:00Z",
  },
  {
    id: "gen-2",
    dataset_id: "ds-2",
    name: "Clinical Trial Generator",
    type: "dp-tvae",
    status: "training",
    parameters_json: { epochs: 200, batch_size: 256 },
    privacy_config: { use_differential_privacy: true, target_epsilon: 5.0, target_delta: 1e-6 },
    created_by: "user1",
    created_at: "2024-12-02T08:00:00Z",
    updated_at: "2024-12-02T09:00:00Z",
  },
]

const mockEvaluations: Evaluation[] = [
  {
    id: "eval-1",
    generator_id: "gen-1",
    dataset_id: "ds-1",
    created_at: "2024-12-01T14:00:00Z",
  },
]

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const id = params?.id as string

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title={mockProject.name}
          description={mockProject.description}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/projects">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Link>
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        {/* Project Metadata */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <MetricCard
            title="Total Datasets"
            value={mockDatasets.length}
            icon={<Database className="h-5 w-5" />}
            quality="neutral"
          />
          <MetricCard
            title="Generators"
            value={mockGenerators.length}
            icon={<Zap className="h-5 w-5" />}
            quality="neutral"
          />
          <MetricCard
            title="Evaluations"
            value={mockEvaluations.length}
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
                <span>{new Date(mockProject.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <User className="h-3 w-3" />
                <span>{mockProject.created_by}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="datasets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="datasets">Datasets ({mockDatasets.length})</TabsTrigger>
            <TabsTrigger value="generators">Generators ({mockGenerators.length})</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations ({mockEvaluations.length})</TabsTrigger>
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
                  data={mockDatasets}
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
                  data={mockGenerators}
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
                    { label: "Download", icon: <Download className="h-4 w-4" />, onClick: () => {} },
                    { label: "Evaluate", icon: <Play className="h-4 w-4" />, onClick: () => {} },
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
                  data={mockEvaluations}
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
                  <p className="text-sm text-muted-foreground mt-1">{mockProject.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground mt-1">{mockProject.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex gap-2 mt-1">
                    {mockProject.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
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
