"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Dataset, Generator, Project, Evaluation, Job } from "./types";

/**
 * TanStack Query hooks for API data fetching
 *
 * Benefits:
 * - Automatic caching and deduplication
 * - Background refetching
 * - Optimistic updates
 * - Request cancellation
 */

// ============================================================================
// QUERY KEYS - Centralized for cache invalidation
// ============================================================================

export const queryKeys = {
  // Auth
  me: ["auth", "me"] as const,

  // Datasets
  datasets: ["datasets"] as const,
  dataset: (id: string) => ["datasets", id] as const,

  // Generators
  generators: ["generators"] as const,
  generator: (id: string) => ["generators", id] as const,
  generatorDetails: (id: string) => ["generators", id, "details"] as const,

  // Projects
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,

  // Evaluations
  evaluations: ["evaluations"] as const,
  evaluation: (id: string) => ["evaluations", id] as const,

  // Jobs
  jobs: ["jobs"] as const,
  job: (id: string) => ["jobs", id] as const,

  // Dashboard
  dashboardSummary: ["dashboard", "summary"] as const,
} as const;

// ============================================================================
// AUTH HOOKS
// ============================================================================

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes - user data rarely changes
    retry: false, // Don't retry auth failures
  });
}

// ============================================================================
// DATASET HOOKS
// ============================================================================

export function useDatasets(skip = 0, limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.datasets, { skip, limit }],
    queryFn: () => api.listDatasets(undefined, skip, limit),
  });
}

export function useDataset(id: string) {
  return useQuery({
    queryKey: queryKeys.dataset(id),
    queryFn: () => api.getDataset(id),
    enabled: !!id,
  });
}

export function useDeleteDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteDataset(id),
    onSuccess: () => {
      // Invalidate datasets list to trigger refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets });
    },
  });
}

// ============================================================================
// GENERATOR HOOKS
// ============================================================================

export function useGenerators() {
  return useQuery({
    queryKey: queryKeys.generators,
    queryFn: () => api.listGenerators(),
  });
}

export function useGenerator(id: string) {
  return useQuery({
    queryKey: queryKeys.generator(id),
    queryFn: () => api.getGenerator(id),
    enabled: !!id,
  });
}

export function useGeneratorDetails(id: string) {
  return useQuery({
    queryKey: queryKeys.generatorDetails(id),
    queryFn: () => api.getGeneratorDetails(id),
    enabled: !!id,
  });
}

export function useDeleteGenerator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteGenerator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generators });
    },
  });
}

// ============================================================================
// PROJECT HOOKS
// ============================================================================

export function useProjects(skip = 0, limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.projects, { skip, limit }],
    queryFn: () => api.listProjects(skip, limit),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// ============================================================================
// EVALUATION HOOKS
// ============================================================================

export function useEvaluations() {
  return useQuery({
    queryKey: queryKeys.evaluations,
    queryFn: () => api.listEvaluations(),
  });
}

export function useEvaluation(id: string) {
  return useQuery({
    queryKey: queryKeys.evaluation(id),
    queryFn: () => api.getEvaluation(id),
    enabled: !!id,
  });
}

// ============================================================================
// JOB HOOKS
// ============================================================================

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => api.listJobs(),
    // Jobs change frequently, shorter stale time
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => api.getJob(id),
    enabled: !!id,
    // Poll for active jobs
    refetchInterval: (query) => {
      const data = query.state.data as Job | undefined;
      if (data && ["pending", "running"].includes(data.status)) {
        return 2000; // Poll every 2 seconds for active jobs
      }
      return false;
    },
  });
}

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary,
    queryFn: () => api.getDashboardSummary(),
    staleTime: 60 * 1000, // 1 minute - dashboard summary doesn't need to be super fresh
  });
}
