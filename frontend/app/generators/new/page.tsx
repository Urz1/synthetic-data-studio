"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  GeneratorConfigForm,
  type GeneratorConfig,
} from "@/components/generators/generator-config-form";
import { ArrowLeft, Database, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import type { Dataset } from "@/lib/types";
import ProtectedRoute from "@/components/layout/protected-route";
import { useToast } from "@/hooks/use-toast";

export default function NewGeneratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDataset = searchParams.get("dataset");
  const { user } = useAuth();

  const [datasets, setDatasets] = React.useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = React.useState(
    preselectedDataset || ""
  );
  const [loadingDatasets, setLoadingDatasets] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [createdGeneratorId, setCreatedGeneratorId] = React.useState<
    string | null
  >(null);
  const { toast } = useToast();

  // Load datasets on mount
  React.useEffect(() => {
    async function loadDatasets() {
      try {
        const data = await api.listDatasets();
        // Handle both array and object with datasets property
        const datasetsList = Array.isArray(data)
          ? data
          : (data as any).datasets || [];
        setDatasets(datasetsList);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to load datasets:", err);
        }
        setError("Failed to load datasets. Please try again.");
      } finally {
        setLoadingDatasets(false);
      }
    }
    loadDatasets();
  }, []);

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  const handleSubmit = async (config: GeneratorConfig) => {
    if (!selectedDatasetId) {
      setError("Please select a dataset first");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.createGenerator(selectedDatasetId, {
        name: config.name,
        model_type: config.model_type,
        num_rows: config.num_rows,
        epochs: config.epochs,
        batch_size: config.batch_size,
        use_differential_privacy: config.use_differential_privacy,
        target_epsilon: config.target_epsilon,
        target_delta: config.target_delta,
        max_grad_norm: config.max_grad_norm,
      });

      // Show success state instead of redirecting
      setCreatedGeneratorId(response.generator_id);

      toast({
        title: "Generator Created Successfully",
        description:
          "Training has started. You can monitor progress here or view the details.",
      });
    } catch (err) {
      console.error("Failed to create generator:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create generator"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdGeneratorId) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full border-success/50 bg-success/5">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-success" />
                </div>
                <CardTitle className="text-2xl text-success">
                  Generator Created!
                </CardTitle>
                <CardDescription>
                  Your synthetic data generator is now initializing and
                  training.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-background rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="font-medium text-sm">
                      Training in progress...
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-7">
                    This process runs in the background. You can navigate away
                    safely.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/generators/${createdGeneratorId}`}>
                      View Generator Details
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/generators">Back to Generators List</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
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
          title="Create Generator"
          description="Configure and train a new synthetic data generator"
        />

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Dataset Selection */}
            {!selectedDatasetId ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Select Source Dataset
                  </CardTitle>
                  <CardDescription>
                    Choose a dataset with at least 100 rows for ML training
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingDatasets ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : datasets.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No datasets found.{" "}
                      <Link
                        href="/datasets/upload"
                        className="text-primary hover:underline"
                      >
                        Upload one first
                      </Link>
                      .
                    </div>
                  ) : (
                    <>
                      <Select
                        value={selectedDatasetId}
                        onValueChange={setSelectedDatasetId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a dataset..." />
                        </SelectTrigger>
                        <SelectContent>
                          {datasets.map((dataset) => (
                            <SelectItem
                              key={dataset.id}
                              value={dataset.id}
                              disabled={
                                dataset.row_count !== undefined &&
                                dataset.row_count < 100
                              }
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={
                                    dataset.row_count !== undefined &&
                                    dataset.row_count < 100
                                      ? "text-muted-foreground"
                                      : ""
                                  }
                                >
                                  {dataset.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  (
                                  {dataset.row_count?.toLocaleString() ||
                                    "unknown"}{" "}
                                  rows)
                                  {dataset.row_count !== undefined &&
                                    dataset.row_count < 100 &&
                                    " - too small"}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        Datasets with fewer than 100 rows are disabled. Use{" "}
                        <Link
                          href="/generators/schema"
                          className="text-primary hover:underline"
                        >
                          schema-based generation
                        </Link>{" "}
                        for smaller datasets.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle
                          className="text-base truncate block max-w-[200px]"
                          title={selectedDataset?.name}
                        >
                          {selectedDataset?.name}
                        </CardTitle>
                        <CardDescription>
                          {selectedDataset?.row_count?.toLocaleString()} rows
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDatasetId("")}
                    >
                      Change
                    </Button>
                  </CardHeader>
                </Card>

                {/* Minimum rows warning for ML training */}
                {selectedDataset?.row_count &&
                  selectedDataset.row_count < 100 && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <strong>Dataset too small for ML training.</strong> ML
                        models require at least 100 rows to learn meaningful
                        patterns. Your dataset has {selectedDataset.row_count}{" "}
                        rows. Please use{" "}
                        <Link
                          href="/generators/schema"
                          className="underline font-medium"
                        >
                          schema-based generation
                        </Link>{" "}
                        instead, or upload a larger dataset.
                      </AlertDescription>
                    </Alert>
                  )}

                {(!selectedDataset?.row_count ||
                  selectedDataset.row_count >= 100) && (
                  <GeneratorConfigForm
                    datasetId={selectedDatasetId}
                    datasetRowCount={selectedDataset?.row_count || 1000}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                )}
              </>
            )}
          </div>

          {/* Sidebar Help */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Training Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  1. <strong>Preprocessing:</strong> Data is encoded and
                  normalized.
                </p>
                <p>
                  2. <strong>Training:</strong> The neural network learns
                  patterns (this may take minutes to hours).
                </p>
                <p>
                  3. <strong>Generation:</strong> Once trained, you can generate
                  unlimited synthetic samples.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
