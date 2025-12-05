"use client"

import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText, Database, Activity, Shield, ArrowRight, BarChart } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"

// Mock synthetic dataset data
const mockSyntheticDataset = {
  id: "sd-123",
  name: "Synthetic_Patients_v1.csv",
  generator_id: "gen-123",
  generator_name: "Patient Records Generator",
  project_id: "proj-1",
  created_at: "2024-12-03T14:30:00Z",
  size_bytes: 15400000, // 15.4 MB
  num_rows: 50000,
  num_columns: 45,
  format: "CSV",
  status: "Available",
  quality_score: 0.88,
  privacy_score: 0.92,
  sample_data: [
    { id: 1, age: 34, gender: "F", diagnosis: "E11.9", zip: "100**", income: "45000-55000" },
    { id: 2, age: 56, gender: "M", diagnosis: "I10", zip: "100**", income: "65000-75000" },
    { id: 3, age: 28, gender: "F", diagnosis: "J01.9", zip: "100**", income: "35000-45000" },
    { id: 4, age: 45, gender: "M", diagnosis: "E78.5", zip: "100**", income: "85000-95000" },
    { id: 5, age: 62, gender: "F", diagnosis: "M54.5", zip: "100**", income: "55000-65000" },
  ]
}

export default function SyntheticDatasetPage() {
  const { user } = useAuth()
  const params = useParams()
  const id = params?.id as string

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Synthetic Dataset Details"
          description={`Manage and download ${mockSyntheticDataset.name}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/generators/${mockSyntheticDataset.generator_id}`}>
                  View Generator
                </Link>
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dataset Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(mockSyntheticDataset.size_bytes)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {mockSyntheticDataset.num_rows.toLocaleString()} rows • {mockSyntheticDataset.num_columns} columns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-blue-600">{(mockSyntheticDataset.quality_score * 100).toFixed(0)}%</div>
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Statistical fidelity to original
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Privacy Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-green-600">{(mockSyntheticDataset.privacy_score * 100).toFixed(0)}%</div>
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Privacy protection level
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="preview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="preview">Data Preview</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="lineage">Lineage</TabsTrigger>
          </TabsList>

          {/* Data Preview */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sample Records</CardTitle>
                    <CardDescription>First 5 rows of generated data</CardDescription>
                  </div>
                  <Badge variant="outline">Preview Mode</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(mockSyntheticDataset.sample_data[0]).map((key) => (
                          <TableHead key={key} className="capitalize">{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockSyntheticDataset.sample_data.map((row, idx) => (
                        <TableRow key={idx}>
                          {Object.values(row).map((val, i) => (
                            <TableCell key={i}>{val}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 flex justify-center">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All Columns <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metadata */}
          <TabsContent value="metadata">
            <Card>
              <CardHeader>
                <CardTitle>Dataset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-sm">{mockSyntheticDataset.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="text-sm">{new Date(mockSyntheticDataset.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <Badge variant="secondary">{mockSyntheticDataset.format}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="bg-green-500">{mockSyntheticDataset.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lineage */}
          <TabsContent value="lineage">
            <Card>
              <CardHeader>
                <CardTitle>Data Lineage</CardTitle>
                <CardDescription>Trace the origin of this synthetic dataset</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative border-l-2 border-muted ml-4 space-y-8 py-2">
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-muted border-2 border-background" />
                    <p className="text-sm font-medium">Original Dataset</p>
                    <p className="text-xs text-muted-foreground">Uploaded by User</p>
                  </div>
                  
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-muted border-2 border-background" />
                    <p className="text-sm font-medium">Generator Training</p>
                    <Link href={`/generators/${mockSyntheticDataset.generator_id}`} className="text-xs text-primary hover:underline">
                      {mockSyntheticDataset.generator_name}
                    </Link>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                    <p className="text-sm font-medium text-primary">Synthetic Generation</p>
                    <p className="text-xs text-muted-foreground">Current Dataset</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <h3 className="font-semibold">Validate Quality</h3>
              <p className="text-sm text-muted-foreground">Run a comprehensive evaluation report for this dataset</p>
            </div>
            <Button asChild>
              <Link href="/evaluations/new">
                <BarChart className="mr-2 h-4 w-4" />
                Run Evaluation
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    </ProtectedRoute>
  )
}
