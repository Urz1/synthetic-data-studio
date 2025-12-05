"use client"

import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { DatasetUpload } from "@/components/datasets/dataset-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Shield, Zap } from "lucide-react"

export default function UploadPage() {
  const router = useRouter()
  const mockUser = { full_name: "John Doe", email: "john@example.com" }

  const handleUploadComplete = (datasetId: string) => {
    // In production, navigate to the dataset detail page
    router.push(`/datasets/${datasetId}`)
  }

  return (
    <AppShell user={mockUser}>
      <PageHeader
        title="Upload Dataset"
        description="Upload a new dataset to begin generating privacy-preserving synthetic data"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DatasetUpload projectId="default-project" onUploadComplete={handleUploadComplete} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What happens next?</CardTitle>
              <CardDescription>After uploading your dataset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="rounded-lg bg-primary/10 p-2 h-fit">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Profiling</p>
                  <p className="text-xs text-muted-foreground">
                    We analyze column types, distributions, and correlations
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="rounded-lg bg-warning/10 p-2 h-fit">
                  <Shield className="h-4 w-4 text-warning-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">PII Detection</p>
                  <p className="text-xs text-muted-foreground">Automatic scanning for sensitive personal information</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="rounded-lg bg-success/10 p-2 h-fit">
                  <Zap className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">Ready to Generate</p>
                  <p className="text-xs text-muted-foreground">Train a generator with optional differential privacy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">CSV</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.csv</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">JSON</span>
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">.json</code>
                </div>
                <div className="pt-2 border-t mt-3">
                  <p className="text-xs text-muted-foreground">
                    Maximum file size: 100 MB
                    <br />
                    Minimum requirements: 2 columns, 1 row
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
