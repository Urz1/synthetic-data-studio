"use client"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GeneratorProgress } from "@/components/generators/generator-progress"
import { PrivacyReportCard } from "@/components/generators/privacy-report-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, Download, FileBarChart, Trash2 } from "lucide-react"
import type { Generator } from "@/lib/types"

// Mock data
const mockGenerator: Generator = {
  id: "1",
  dataset_id: "d1",
  name: "Patient Records Generator",
  type: "dp-ctgan",
  status: "completed",
  parameters_json: { epochs: 300, batch_size: 500, num_rows: 10000 },
  privacy_config: { use_differential_privacy: true, target_epsilon: 10.0, target_delta: 1e-5 },
  privacy_spent: { epsilon: 8.7, delta: 9.8e-6 },
  training_metadata: { duration_seconds: 342, final_loss: 0.023 },
  output_dataset_id: "synthetic-1",
  created_by: "user1",
  created_at: "2024-12-10T10:00:00Z",
  updated_at: "2024-12-10T12:00:00Z",
}

export default function GeneratorDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const generator = mockGenerator // In production, fetch based on params.id

  return (
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
        description={`Created on ${new Date(generator.created_at).toLocaleDateString()}`}
        actions={
          generator.status === "completed" && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Data
              </Button>
              <Button asChild>
                <Link href={`/evaluations/new?generator=${generator.id}`}>
                  <FileBarChart className="mr-2 h-4 w-4" />
                  Run Evaluation
                </Link>
              </Button>
            </div>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress/Status */}
          <GeneratorProgress
            status={generator.status}
            name={generator.name}
            progress={100}
            metadata={{
              duration_seconds: generator.training_metadata?.duration_seconds,
              current_epoch: generator.parameters_json.epochs,
              total_epochs: generator.parameters_json.epochs,
              final_loss: generator.training_metadata?.final_loss,
            }}
          />

          {/* Privacy Report */}
          <PrivacyReportCard
            generator={generator}
            privacyGuarantee={`With (ε=${generator.privacy_spent?.epsilon}, δ=${generator.privacy_spent?.delta?.toExponential(1)})-differential privacy, the probability of identifying any individual in the training data is bounded by e^${generator.privacy_spent?.epsilon} ≈ ${Math.round(Math.exp(generator.privacy_spent?.epsilon || 0))}x compared to not being in the data.`}
            recommendations={[
              "Privacy budget provides strong protection for HIPAA compliance",
              "Synthetic data suitable for external sharing with analysts",
              "Consider lower epsilon for more sensitive use cases",
            ]}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generator Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={generator.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Model</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{generator.type}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Epochs</span>
                <span className="font-mono text-sm">{generator.parameters_json.epochs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Batch Size</span>
                <span className="font-mono text-sm">{generator.parameters_json.batch_size}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rows Generated</span>
                <span className="font-mono text-sm">{generator.parameters_json.num_rows?.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {generator.output_dataset_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Synthetic Dataset</CardTitle>
                <CardDescription>Generated output</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href={`/synthetic-datasets/${generator.output_dataset_id}`}>View Synthetic Dataset</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-risk/20">
            <CardHeader>
              <CardTitle className="text-base text-risk">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Generator
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
