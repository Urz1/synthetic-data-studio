"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Download,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Shield,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Evaluation } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import ProtectedRoute from "@/components/layout/protected-route";
import { EvaluationMetricsGrid } from "@/components/evaluations/evaluation-metrics-grid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle2; className: string; label: string }
> = {
  completed: {
    icon: CheckCircle2,
    className: "text-success",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    className: "text-destructive",
    label: "Failed",
  },
  pending: {
    icon: Clock,
    className: "text-muted-foreground",
    label: "Pending",
  },
  running: {
    icon: Loader2,
    className: "text-primary animate-spin",
    label: "Running",
  },
};

export default function EvaluationDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const evaluationId = params?.id as string;
  const { toast } = useToast();

  const [evaluation, setEvaluation] = React.useState<any>(null);
  const [generator, setGenerator] = React.useState<any>(null);
  const [dataset, setDataset] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (evaluationId) {
      loadEvaluation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId]);

  async function loadEvaluation() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEvaluationDetails(evaluationId);
      setEvaluation(data.evaluation);
      setGenerator(data.generator);
      setDataset(data.dataset);
    } catch (err) {
      console.error("Failed to load evaluation:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load evaluation"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setIsDeleting(true);
      await api.deleteEvaluation(evaluationId);
      toast({
        title: "Evaluation Deleted",
        description: "The evaluation has been deleted successfully.",
      });
      router.push("/evaluations");
    } catch (err) {
      toast({
        title: "Delete Failed",
        description:
          err instanceof Error ? err.message : "Failed to delete evaluation",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  }

  function handleExport() {
    if (evaluation?.report) {
      const dataStr = JSON.stringify(evaluation.report, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `evaluation-${evaluationId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Export Complete",
        description: "Evaluation report has been downloaded",
      });
    }
  }

  const status = evaluation?.status
    ? statusConfig[evaluation.status] || statusConfig.pending
    : statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/evaluations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Evaluations
            </Link>
          </Button>
        </div>

        {evaluation && (
          <PageHeader
            title={`Evaluation Report`}
            description={`ID: ${evaluationId.substring(0, 12)}... • Status: ${
              evaluation.status?.charAt(0).toUpperCase() +
              evaluation.status?.slice(1)
            } • ${new Date(evaluation.created_at).toLocaleDateString()}`}
            actions={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={!evaluation.report}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export Report</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            }
          />
        )}
        {!evaluation && !loading && (
          <PageHeader
            title="Evaluation Report"
            description="Loading evaluation data..."
          />
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadEvaluation}
                  className="ml-4"
                >
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : evaluation ? (
          <div className="space-y-8">
            {/* Status Overview - Compact, Minimal */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {StatusIcon && <StatusIcon className={`h-5 w-5 ${status.className}`} />}
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{status.label}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {evaluation.created_at ? new Date(evaluation.created_at).toLocaleString() : "Unknown"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Generator</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/generators/${evaluation.generator_id}`}
                    className="text-sm font-semibold hover:text-primary transition-colors"
                  >
                    {generator?.name || evaluation.generator_id.substring(0, 12)}...
                  </Link>
                  {generator?.type && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Type: {generator.type}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Dataset</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold truncate">
                    {dataset?.name || "Unknown"}
                  </p>
                  {dataset?.row_count && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {dataset.row_count.toLocaleString()} rows
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Primary Action Cards - Key Functions */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="group overflow-hidden border-2 border-transparent hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10">
                <Link href={`/evaluations/${evaluationId}/explain`} className="block h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-base group-hover:text-primary transition-colors">
                      <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      AI Analysis
                    </CardTitle>
                    <CardDescription className="group-hover:text-foreground/70 transition-colors">
                      Get LLM-powered insights and recommendations
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>

              <Card className="group overflow-hidden border-2 border-transparent hover:border-warning/50 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-warning/5 to-transparent hover:from-warning/10">
                <Link href={`/evaluations/${evaluationId}/risk`} className="block h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-base group-hover:text-warning transition-colors">
                      <div className="p-2 rounded-lg bg-warning/20 group-hover:bg-warning/30 transition-colors">
                        <Shield className="h-5 w-5 text-warning" />
                      </div>
                      Risk Assessment
                    </CardTitle>
                    <CardDescription className="group-hover:text-foreground/70 transition-colors">
                      View detailed privacy and disclosure risks
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>

              <Card className="group overflow-hidden border-2 border-transparent hover:border-success/50 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-success/5 to-transparent hover:from-success/10">
                <Link href={`/evaluations/compare?ids=${evaluationId}`} className="block h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-base group-hover:text-success transition-colors">
                      <div className="p-2 rounded-lg bg-success/20 group-hover:bg-success/30 transition-colors">
                        <BarChart3 className="h-5 w-5 text-success" />
                      </div>
                      Compare
                    </CardTitle>
                    <CardDescription className="group-hover:text-foreground/70 transition-colors">
                      Compare with other evaluations
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            </div>

            {/* Professional Metrics Grid - Use dedicated component */}
            {evaluation.report && (
              <EvaluationMetricsGrid report={evaluation.report} />
            )}

            {/* Evaluation Details - Metadata & Context */}
            {evaluation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Evaluation Details
                  </CardTitle>
                  <CardDescription>
                    Complete metadata and evaluation context
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Generator Info */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Generator Type
                      </p>
                      <Badge variant="secondary" className="w-fit">
                        {generator?.type || "Unknown"}
                      </Badge>
                    </div>

                    {/* Report ID */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Evaluation ID
                      </p>
                      <code className="text-sm bg-muted px-2 py-1 rounded break-all">
                        {evaluation.id?.substring(0, 16)}...
                      </code>
                    </div>

                    {/* Evaluation Date */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Evaluated
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(evaluation.created_at).toLocaleDateString()} at{" "}
                        {new Date(evaluation.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Duration */}
                    {evaluation.completed_at && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Duration
                        </p>
                        <p className="text-sm font-medium">
                          {Math.round(
                            (new Date(evaluation.completed_at).getTime() -
                              new Date(evaluation.created_at).getTime()) /
                              1000
                          )}{" "}
                          seconds
                        </p>
                      </div>
                    )}

                    {/* Dataset Info */}
                    {dataset?.name && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Dataset
                        </p>
                        <p className="text-sm font-medium truncate">
                          {dataset.name}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Evaluation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this evaluation? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppShell>
    </ProtectedRoute>
  );
}
