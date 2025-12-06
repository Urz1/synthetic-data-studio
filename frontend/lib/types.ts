// Core domain types for Synth Studio

import { ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  role?: string;
  avatar_url?: string | null;
  oauth_provider?: string | null;
}

export interface OAuthProvider {
  name: string;
  enabled: boolean;
  auth_url: string | null;
}

export interface OAuthCallbackResponse {
  access_token: string;
  token_type: string;
  user: User;
  is_new_user: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  default_retention_days: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Dataset {
  description: ReactNode;
  num_rows: any;
  id: string;
  project_id: string;
  name: string;
  original_filename?: string;
  file_path?: string;
  size_bytes?: number;
  row_count?: number;
  schema_data: {
    columns: string[];
    dtypes: Record<string, string>;
  };
  status: "uploaded" | "profiling" | "profiled" | "error";
  checksum: string;
  pii_flags?: Record<string, PiiFlag>;
  profiling_data?: ProfileData;
  version: number;
  uploader_id: string;
  uploaded_at: string;
  deleted_at?: string;
}

export interface PiiFlag {
  pii_type: string;
  confidence: number;
  sample_matches?: string[];
}

export interface PiiDetectionEnhancedResult {
  pii_results: Record<
    string,
    { pii_type: string; confidence: number; sample_matches?: string[] }
  >;
  flagged_columns: string[];
  risk_analysis: {
    direct_identifiers: string[];
    indirect_identifiers: string[];
    k_anonymity_risk: string;
    re_identification_score: number;
  };
}

export interface ProfileData {
  row_count: number;
  column_count: number;
  columns: Record<string, ColumnProfile>;
  correlations?: Record<string, number>;
}

export interface ColumnProfile {
  type: "numeric" | "categorical" | "datetime" | "text";
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  missing_count: number;
  missing_percent: number;
  unique_count?: number;
  top_values?: Record<string, number>;
}

export type ModelType =
  | "ctgan"
  | "tvae"
  | "timegan"
  | "dp-ctgan"
  | "dp-tvae"
  | "schema";
export type GeneratorStatus =
  | "pending"
  | "training"
  | "generating"
  | "completed"
  | "failed";

export interface Generator {
  id: string;
  dataset_id?: string;
  model_version_id?: string;
  type: ModelType;
  parameters_json: GeneratorParameters;
  schema_json?: Record<string, unknown>;
  name: string;
  status: GeneratorStatus;
  output_dataset_id?: string;
  model_path?: string;
  training_metadata?: {
    duration_seconds: number;
    final_loss: number;
  };
  privacy_config?: PrivacyConfig;
  privacy_spent?: PrivacySpent;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratorParameters {
  epochs?: number;
  batch_size?: number;
  num_rows?: number;
  column_types?: Record<string, string>;
  target_epsilon?: number;
  target_delta?: number;
  max_grad_norm?: number;
}

export interface SchemaGeneratorConfig {
  columns: Record<
    string,
    {
      type: string;
      faker?: string;
      min?: number;
      max?: number;
      options?: string[];
    }
  >;
}

export interface PrivacyConfig {
  use_differential_privacy: boolean;
  target_epsilon: number;
  target_delta: number;
  max_grad_norm?: number;
  mechanism?: string;
}

export interface PrivacySpent {
  epsilon: number;
  delta: number;
}

export interface PrivacyReport {
  generator_id: string;
  privacy_config: PrivacyConfig;
  privacy_spent: PrivacySpent;
  privacy_guarantee: string;
  recommendations: string[];
}

export interface ModelCard {
  id: string;
  generator_id: string;
  content: string; // Markdown
  created_at: string;
}

export interface SyntheticDataset {
  id: string;
  project_id: string;
  name: string;
  original_filename: string;
  size_bytes: number;
  row_count: number;
  schema_data: {
    columns: string[];
    dtypes: Record<string, string>;
  };
  status: string;
  checksum: string;
  uploaded_at: string;
}

export interface Evaluation {
  status: string;
  id: string;
  generator_id: string;
  dataset_id: string;
  report?: EvaluationReport;
  insights?: Record<string, any>;
  risk_score?: number;
  risk_level?: "low" | "medium" | "high";
  risk_details?: Record<string, any>;
  created_at: string;
}

export interface EvaluationReport {
  statistical_similarity: {
    overall_score: number;
    column_scores: Record<
      string,
      { ks_statistic?: number; chi2_statistic?: number; p_value: number }
    >;
    correlation_difference: number;
  };
  ml_utility: {
    train_on_synthetic_test_on_real: { accuracy: number; f1: number };
    train_on_real_test_on_real: { accuracy: number; f1: number };
    utility_preservation: number;
  };
  privacy: {
    membership_inference_auc: number;
    attribute_inference_accuracy: number;
    nearest_neighbor_distance: { min: number; mean: number; std: number };
    privacy_risk: "low" | "medium" | "high";
  };
  overall_quality_score: number;
  recommendations: string[];
}

export interface RiskAssessment {
  evaluation_id: string;
  risk_level: "low" | "medium" | "high";
  risk_score: number;
  risk_factors: {
    re_identification_risk: RiskFactor;
    attribute_disclosure_risk: RiskFactor;
    membership_inference_risk: RiskFactor;
  };
  compliance: {
    hipaa_suitable: boolean;
    gdpr_suitable: boolean;
    notes: string;
  };
  recommendations: string[];
}

export interface RiskFactor {
  level: "low" | "medium" | "high";
  score: number;
  details: string;
}

export interface Job {
  id: string;
  project_id: string;
  type: "training" | "generation" | "evaluation";
  status: "pending" | "running" | "completed" | "failed";
  generator_id?: string;
  dataset_id?: string;
  progress?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  context_used?: {
    evaluation_id?: string;
    generator_id?: string;
    generator_type?: string;
    current_epsilon?: number;
  };
}

export interface Export {
  id: string;
  generator_id?: string;
  dataset_id?: string;
  export_type: "model_card" | "privacy_report" | "dataset";
  format: "pdf" | "docx" | "csv" | "json";
  status: "pending" | "completed" | "failed";
  download_url?: string;
  created_at: string;
  expires_at: string;
}

export interface ModelCardExport {
  message: string;
  export_id: string;
  download_url: string;
  filename: string;
  expires_in: number;
}

// Billing
export interface UsageRecord {
  id: string;
  user_id: string;
  resource_type: "generation" | "training" | "evaluation";
  resource_id: string;
  quantity: number;
  unit: "rows" | "seconds" | "count";
  timestamp: string;
}

export interface Quota {
  id: string;
  user_id: string;
  resource_type: string;
  limit: number;
  used: number;
  period: "monthly" | "daily" | "lifetime";
  reset_at: string;
}

export interface BillingReport {
  period_start: string;
  period_end: string;
  total_usage: Record<string, number>;
  estimated_cost: number;
  currency: string;
}

// Audit
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface AuditStats {
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_user: Record<string, number>;
  recent_failures: number;
}

// Compliance
export interface ComplianceReport {
  id: string;
  generator_id: string;
  framework: "GDPR" | "HIPAA" | "CCPA" | "SOC2";
  status: "compliant" | "non_compliant" | "warning";
  report_data: Record<string, unknown>;
  generated_at: string;
}
