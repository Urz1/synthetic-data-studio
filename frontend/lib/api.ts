// API client for Synth Studio backend

import type {
  User,
  Project,
  Dataset,
  Generator,
  SyntheticDataset,
  Evaluation,
  RiskAssessment,
  Job,
  ChatMessage,
  ChatResponse,
  ModelType,
  PrivacyConfig,
  OAuthProvider,
  PiiDetectionEnhancedResult,
  SchemaGeneratorConfig,
  ComplianceReport,
  UsageRecord,
  Quota,
  BillingReport,
  AuditLog,
  AuditStats,
  Export,
  ModelCard,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("synth_token", token);
      } else {
        localStorage.removeItem("synth_token");
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("synth_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));

      // Handle different error formats from FastAPI
      if (Array.isArray(error.detail)) {
        // Validation errors
        const messages = error.detail.map((err: any) => err.msg).join(", ");
        throw new Error(messages);
      } else if (typeof error.detail === "string") {
        throw new Error(error.detail);
      } else if (error.detail && typeof error.detail === "object") {
        throw new Error(JSON.stringify(error.detail));
      } else {
        throw new Error("An error occurred");
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(
    email: string,
    password: string
  ): Promise<{ access_token: string }> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Login failed" }));

      if (Array.isArray(error.detail)) {
        const messages = error.detail.map((err: any) => err.msg).join(", ");
        throw new Error(messages);
      } else if (typeof error.detail === "string") {
        throw new Error(error.detail);
      } else {
        throw new Error("Login failed");
      }
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async register(
    email: string,
    password: string,
    fullName: string
  ): Promise<User> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request("/auth/me");
  }

  logout() {
    this.setToken(null);
  }

  async listOAuthProviders(): Promise<{ providers: OAuthProvider[] }> {
    return this.request("/auth/providers");
  }

  // Projects
  async listProjects(skip = 0, limit = 50): Promise<Project[]> {
    return this.request(`/projects?skip=${skip}&limit=${limit}`);
  }

  async getProject(id: string): Promise<Project> {
    return this.request(`/projects/${id}`);
  }

  async createProject(data: {
    name: string;
    description?: string;
    default_retention_days?: number;
  }): Promise<Project> {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request(`/projects/${id}`, { method: "DELETE" });
  }

  // Datasets
  async listDatasets(
    projectId?: string,
    skip = 0,
    limit = 50
  ): Promise<{ datasets: Dataset[]; total: number }> {
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
    });
    if (projectId) params.append("project_id", projectId);
    return this.request(`/datasets?${params}`);
  }

  async getDataset(id: string): Promise<Dataset> {
    return this.request(`/datasets/${id}`);
  }

  async uploadDataset(file: File, projectId: string): Promise<Dataset> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", projectId);

    return this.request("/datasets/upload", {
      method: "POST",
      body: formData,
    });
  }

  async profileDataset(
    id: string
  ): Promise<{ dataset_id: string; profile: Dataset["profiling_data"] }> {
    return this.request(`/datasets/${id}/profile`, { method: "POST" });
  }

  async getProfile(
    id: string
  ): Promise<{ dataset_id: string; profile: Dataset["profiling_data"] }> {
    return this.request(`/datasets/${id}/profile`);
  }

  async detectPii(id: string): Promise<{
    dataset_id: string;
    pii_results: Record<
      string,
      { pii_type: string; confidence: number; sample_matches?: string[] }
    >;
    flagged_columns: string[];
    recommendations: Record<string, string>;
  }> {
    return this.request(`/datasets/${id}/pii-detection`, { method: "POST" });
  }

  async detectPiiEnhanced(id: string): Promise<PiiDetectionEnhancedResult> {
    return this.request(`/datasets/${id}/pii-detection-enhanced`, {
      method: "POST",
    });
  }

  async getPiiFlags(id: string): Promise<{
    pii_results: Record<
      string,
      { pii_type: string; confidence: number; sample_matches?: string[] }
    >;
    flagged_columns: string[];
  }> {
    return this.request(`/datasets/${id}/pii-flags`);
  }

  async downloadDataset(
    id: string
  ): Promise<{ download_url: string; expires_in: number }> {
    return this.request(`/datasets/${id}/download`);
  }

  async deleteDataset(id: string): Promise<void> {
    return this.request(`/datasets/${id}`, { method: "DELETE" });
  }

  // Generators
  async listGenerators(
    datasetId?: string,
    skip = 0,
    limit = 50
  ): Promise<Generator[]> {
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
    });
    if (datasetId) params.append("dataset_id", datasetId);
    return this.request(`/generators?${params}`);
  }

  async getGenerator(id: string): Promise<Generator> {
    return this.request(`/generators/${id}`);
  }

  async createGenerator(
    datasetId: string,
    config: {
      name: string;
      model_type: ModelType;
      num_rows?: number;
      epochs?: number;
      batch_size?: number;
      column_types?: Record<string, string>;
      use_differential_privacy?: boolean;
      target_epsilon?: number;
      target_delta?: number;
      max_grad_norm?: number;
    }
  ): Promise<{ message: string; generator_id: string; job_id: string }> {
    return this.request(`/generators/dataset/${datasetId}/generate`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  async generateSchemaBased(
    config: SchemaGeneratorConfig,
    numRows = 1000
  ): Promise<{
    id: string;
    type: "schema";
    status: "completed";
    output_dataset_id: string;
  }> {
    return this.request(`/generators/schema/generate?num_rows=${numRows}`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  async startGeneration(
    generatorId: string,
    numRows?: number
  ): Promise<{ message: string; job_id: string }> {
    const body = numRows ? JSON.stringify({ num_rows: numRows }) : undefined;
    return this.request(`/generators/${generatorId}/generate`, {
      method: "POST",
      body,
    });
  }

  async downloadModel(
    id: string
  ): Promise<{ download_url: string; expires_in: number }> {
    return this.request(`/generators/${id}/download-model`);
  }

  async downloadModelFile(id: string): Promise<Blob> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `${API_BASE}/generators/${id}/download-model-file`,
      {
        headers,
      }
    );

    if (!response.ok) throw new Error("Download failed");
    return response.blob();
  }

  async getDpParameterLimits(datasetId: string): Promise<{
    dataset_id: string;
    row_count: number;
    recommended: {
      epsilon: { min: number; recommended: number; max: number };
      delta: { recommended: number; max: number };
      max_grad_norm: { recommended: number };
    };
    warnings: string[];
  }> {
    return this.request(`/generators/dp/parameter-limits/${datasetId}`);
  }

  async getRecommendedDpConfig(
    datasetId: string,
    privacyLevel: "low" | "medium" | "high" | "very_high"
  ): Promise<{
    epsilon: number;
    delta: number;
    epochs: number;
    batch_size: number;
  }> {
    return this.request(
      `/generators/dp/recommended-config?dataset_id=${datasetId}&privacy_level=${privacyLevel}`
    );
  }

  async validateDpConfig(config: {
    dataset_id: string;
    target_epsilon: number;
    target_delta: number;
    epochs: number;
    batch_size: number;
  }): Promise<{
    valid: boolean;
    estimated_privacy_spent?: { epsilon: number; delta: number };
    errors?: string[];
    warnings: string[];
    utility_estimate?: string;
  }> {
    return this.request("/generators/dp/validate", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  async getPrivacyReport(generatorId: string): Promise<{
    generator_id: string;
    privacy_config: PrivacyConfig & { mechanism: string };
    privacy_spent: { epsilon: number; delta: number };
    privacy_guarantee: string;
    recommendations: string[];
  }> {
    return this.request(`/generators/${generatorId}/privacy-report`);
  }

  async getModelCard(generatorId: string): Promise<Record<string, unknown>> {
    return this.request(`/generators/${generatorId}/model-card`);
  }

  async generateComplianceReport(
    generatorId: string,
    framework: "GDPR" | "HIPAA" | "CCPA" | "SOC2"
  ): Promise<ComplianceReport> {
    return this.request(
      `/generators/${generatorId}/compliance-report?framework=${framework}`,
      { method: "POST" }
    );
  }

  async getAuditNarrative(generatorId: string): Promise<{ narrative: string }> {
    return this.request(`/generators/${generatorId}/audit-narrative`);
  }

  async deleteGenerator(id: string): Promise<void> {
    return this.request(`/generators/${id}`, { method: "DELETE" });
  }

  // Synthetic Datasets
  async listSyntheticDatasets(): Promise<SyntheticDataset[]> {
    return this.request("/synthetic-datasets");
  }

  async getSyntheticDataset(id: string): Promise<SyntheticDataset> {
    return this.request(`/synthetic-datasets/${id}`);
  }

  async downloadSyntheticDataset(
    id: string
  ): Promise<{ download_url: string; expires_in: number }> {
    return this.request(`/synthetic-datasets/${id}/download`);
  }

  async deleteSyntheticDataset(id: string): Promise<void> {
    return this.request(`/synthetic-datasets/${id}`, { method: "DELETE" });
  }

  // Evaluations
  async listEvaluations(generatorId?: string): Promise<Evaluation[]> {
    const params = generatorId ? `?generator_id=${generatorId}` : "";
    return this.request(`/evaluations${params}`);
  }

  async getEvaluation(id: string): Promise<Evaluation> {
    return this.request(`/evaluations/${id}`);
  }

  async runEvaluation(config: {
    generator_id: string;
    dataset_id: string;
    target_column?: string;
    sensitive_columns?: string[];
    include_statistical?: boolean;
    include_ml_utility?: boolean;
    include_privacy?: boolean;
  }): Promise<Evaluation> {
    return this.request("/evaluations/run", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  async quickEvaluation(generatorId: string): Promise<Evaluation> {
    return this.request(`/evaluations/quick/${generatorId}`, {
      method: "POST",
    });
  }

  async getRiskReport(evaluationId: string): Promise<RiskAssessment> {
    return this.request(`/evaluations/${evaluationId}/risk-report`);
  }

  async explainEvaluation(id: string): Promise<{
    evaluation_id: string;
    explanation: string;
    key_findings: string[];
    concerns: string[];
    recommendations: string[];
  }> {
    return this.request(`/evaluations/${id}/explain`, { method: "POST" });
  }

  async compareEvaluations(ids: string[]): Promise<{
    comparison: Record<
      string,
      {
        generator_type: string;
        overall_score: number;
        statistical_similarity: number;
        ml_utility: number;
        privacy_score: number;
      }
    >;
    recommendation: string;
    best_for_analytics: string;
    best_for_privacy: string;
  }> {
    return this.request("/evaluations/compare", {
      method: "POST",
      body: JSON.stringify({ evaluation_ids: ids }),
    });
  }

  async assessRisk(evaluationId: string): Promise<RiskAssessment> {
    return this.request(`/evaluations/${evaluationId}/assess-risk`, {
      method: "POST",
    });
  }

  // LLM Chat
  async chat(
    message: string,
    context?: {
      evaluation_id?: string;
      generator_id?: string;
      history?: ChatMessage[];
    }
  ): Promise<ChatResponse> {
    return this.request("/llm/chat", {
      method: "POST",
      body: JSON.stringify({ message, ...context }),
    });
  }

  async explainMetric(
    metricName: string,
    value?: number
  ): Promise<{
    metric_name: string;
    explanation: string;
    value_interpretation?: string;
    good_values: string;
    action_if_poor: string;
  }> {
    const params = new URLSearchParams({ metric_name: metricName });
    if (value !== undefined) params.append("value", String(value));
    return this.request(`/llm/explain-metric?${params}`);
  }

  async suggestImprovements(evaluationId: string): Promise<{
    evaluation_id: string;
    current_scores: Record<string, number>;
    suggestions: Array<{
      area: string;
      current_value: number;
      target_value: number;
      suggestion: string;
      implementation: string;
    }>;
  }> {
    return this.request(`/llm/suggest-improvements/${evaluationId}`, {
      method: "POST",
    });
  }

  async exportPrivacyReport(
    generatorId: string,
    format: "pdf" | "docx" = "pdf",
    saveToS3 = true
  ): Promise<{
    message: string;
    export_id: string;
    download_url: string;
    filename: string;
    expires_in: number;
  }> {
    return this.request(
      `/llm/privacy-report/${generatorId}/export?format=${format}&save_to_s3=${saveToS3}`,
      {
        method: "POST",
      }
    );
  }

  async generateFeatures(
    schema: Record<string, unknown>
  ): Promise<{ features: string[] }> {
    return this.request("/llm/generate-features", {
      method: "POST",
      body: JSON.stringify(schema),
    });
  }

  async detectPiiLLM(datasetId: string): Promise<PiiDetectionEnhancedResult> {
    return this.request("/llm/detect-pii", {
      method: "POST",
      body: JSON.stringify({ dataset_id: datasetId }),
    });
  }

  async generatePrivacyReportJSON(generatorId: string): Promise<PrivacyConfig> {
    return this.request("/llm/privacy-report", {
      method: "POST",
      body: JSON.stringify({ generator_id: generatorId }),
    });
  }

  async generateModelCardJSON(generatorId: string): Promise<ModelCard> {
    return this.request("/llm/model-card", {
      method: "POST",
      body: JSON.stringify({ generator_id: generatorId }),
    });
  }

  // Exports
  async listExports(
    skip = 0,
    limit = 50
  ): Promise<{ exports: Export[]; total: number }> {
    return this.request(`/exports?skip=${skip}&limit=${limit}`);
  }

  async getExport(id: string): Promise<Export> {
    return this.request(`/exports/${id}`);
  }

  async downloadExport(
    id: string
  ): Promise<{ download_url: string; expires_in: number }> {
    return this.request(`/exports/${id}/download`);
  }

  async deleteExport(id: string): Promise<void> {
    return this.request(`/exports/${id}`, { method: "DELETE" });
  }

  // Billing
  async listUsage(): Promise<UsageRecord[]> {
    return this.request("/billing/usage");
  }

  async recordUsage(data: {
    resource_type: string;
    resource_id: string;
    quantity: number;
    unit: string;
  }): Promise<UsageRecord> {
    return this.request("/billing/usage", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUsageSummary(
    startDate?: string,
    endDate?: string
  ): Promise<BillingReport> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return this.request(`/billing/usage/summary?${params}`);
  }

  async listQuotas(): Promise<Quota[]> {
    return this.request("/billing/quotas");
  }

  async createQuota(data: Partial<Quota>): Promise<Quota> {
    return this.request("/billing/quotas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateQuota(id: string, data: Partial<Quota>): Promise<Quota> {
    return this.request(`/billing/quotas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async resetQuota(id: string): Promise<void> {
    return this.request(`/billing/quotas/${id}/reset`, { method: "POST" });
  }

  async getQuotaStatus(): Promise<Record<string, boolean>> {
    return this.request("/billing/quotas/status");
  }

  async getBillingReport(
    startDate?: string,
    endDate?: string
  ): Promise<BillingReport> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    return this.request(`/billing/report?${params}`);
  }

  // Audit
  async listAuditLogs(
    skip = 0,
    limit = 50
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.request(`/audit?skip=${skip}&limit=${limit}`);
  }

  async getAuditLog(id: string): Promise<AuditLog> {
    return this.request(`/audit/${id}`);
  }

  async getUserAuditLogs(userId: string): Promise<AuditLog[]> {
    return this.request(`/audit/user/${userId}`);
  }

  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string
  ): Promise<AuditLog[]> {
    return this.request(`/audit/resource/${resourceType}/${resourceId}`);
  }

  async getAuditStatsSummary(): Promise<AuditStats> {
    return this.request("/audit/stats/summary");
  }

  // Compliance
  async listComplianceReports(): Promise<ComplianceReport[]> {
    return this.request("/compliance");
  }

  async createComplianceReport(data: {
    generator_id: string;
    framework: string;
    report_data: Record<string, unknown>;
  }): Promise<ComplianceReport> {
    return this.request("/compliance", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Jobs
  async createJob(data: {
    project_id: string;
    type: string;
    dataset_id?: string;
    generator_id?: string;
  }): Promise<Job> {
    return this.request("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Jobs
  async listJobs(): Promise<Job[]> {
    return this.request("/jobs");
  }

  async getJob(id: string): Promise<Job> {
    return this.request(`/jobs/${id}`);
  }
}

export const api = new ApiClient();
