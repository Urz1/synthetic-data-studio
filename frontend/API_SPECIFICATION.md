# Synth Studio API Specification

## Zero-Context Frontend Handoff Document

**Version:** 2.1
**Last Updated:** December 2025
**Status:** Production / Verified against Codebase (87 endpoints)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Global Standards](#2-global-standards)
3. [Authentication](#3-authentication)
4. [Projects API](#4-projects-api)
5. [Datasets API](#5-datasets-api)
6. [Generators API](#6-generators-api)
7. [Synthetic Datasets API](#7-synthetic-datasets-api)
8. [Evaluations API](#8-evaluations-api)
9. [LLM Chat & Features API](#9-llm-chat--features-api)
10. [Exports API](#10-exports-api)
11. [Jobs API](#11-jobs-api)
12. [Billing API](#12-billing-api)
13. [Audit API](#13-audit-api)
14. [Compliance API](#14-compliance-api)
15. [Error Handling](#15-error-handling)

---

## 1. Executive Summary

### What is Synth Studio?

Synth Studio is a platform for generating privacy-preserving synthetic data from real datasets using machine learning models. The platform supports differential privacy guarantees, comprehensive evaluation metrics, and LLM-powered insights.

### Core User Flows

#### Flow 1: Dataset Upload → Generator Training → Synthetic Data Generation

```
1. Create Project → POST /projects
2. Upload Dataset → POST /datasets/upload
3. Profile Dataset → POST /datasets/{id}/profile
4. Detect PII → POST /datasets/{id}/pii-detection
5. Create Generator → POST /generators/dataset/{dataset_id}/generate
6. Monitor Training → GET /generators/{id}
7. Download Synthetic Data → GET /synthetic-datasets/{id}/download
```

#### Flow 2: Evaluation & Reporting

```
1. Run Evaluation → POST /evaluations/run
2. View Results → GET /evaluations/{id}
3. Get AI Explanation → POST /evaluations/{id}/explain
4. Risk Assessment → POST /evaluations/{id}/assess-risk
5. Export Report → POST /llm/privacy-report/export/pdf
```

#### Flow 3: Chat-based Assistance

```
1. Chat with AI → POST /llm/chat
2. Get Metric Explanation → GET /llm/explain-metric
3. Get Suggestions → POST /llm/suggest-improvements/{evaluation_id}
```

---

## 2. Global Standards

### Base URL

```
Production: https://your-domain.com
Development: http://localhost:8000
```

_Note: All endpoints below are relative to this base URL (e.g., `/auth/login`)_.

### Request Headers

All authenticated requests **MUST** include:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

For file uploads:

```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### Date Format

All dates are ISO 8601 format in UTC:

```
2024-12-15T14:30:00.000Z
```

### UUID Format

All resource IDs are UUID v4 format:

```
550e8400-e29b-41d4-a716-446655440000
```

### Standard Error Response

```json
{
  "detail": "Error message describing what went wrong"
}
```

Or for validation errors (FastAPI standard):

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 3. Authentication

### 3.1 Register New User

**Endpoint:** `POST /auth/register`
**Auth Required:** No

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

_Note: `full_name` is NOT supported during registration._

**Password Requirements:**

- Minimum 8 characters
- Max 72 bytes
- At least one uppercase letter
- At least one number
- At least one special character: `!@#$%^&*()_+-=[]{}|;:,.<>?`

**Success Response (201):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "is_active": true,
  "created_at": "2024-12-15T14:30:00.000Z",
  "name": null,
  "avatar_url": null,
  "oauth_provider": null
}
```

### 3.2 Login

**Endpoint:** `POST /auth/login`
**Auth Required:** No
**Content-Type:** `application/json`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer"
}
```

### 3.3 Get Current User

**Endpoint:** `GET /auth/me`
**Auth Required:** Yes

**Success Response (200):**
Returns same structure as Register response.

### 3.4 List OAuth Providers

**Endpoint:** `GET /auth/providers`
**Auth Required:** No

**Success Response (200):**

```json
{
  "providers": [
    {
      "name": "google",
      "enabled": true,
      "auth_url": "/auth/google"
    },
    {
      "name": "github",
      "enabled": false,
      "auth_url": null
    }
  ]
}
```

### 3.5 OAuth Login (Google/GitHub)

**Endpoints:**

- `GET /auth/google`
- `GET /auth/github`

**Behavior:** Redirects to provider. Callback returns JSON with token.

---

## 4. Projects API

### 4.1 Create Project

**Endpoint:** `POST /projects/`
**Auth Required:** Yes

**Request Body:**

```json
{
  "name": "Healthcare Data",
  "description": "Optional description",
  "default_retention_days": 30
}
```

**Constraints:**

- `name`: 1-100 chars
- `default_retention_days`: 1-365 (default 30)

### 4.2 List Projects

**Endpoint:** `GET /projects/`
**Auth Required:** Yes

**Query Parameters:**

- `skip`: int (default 0)
- `limit`: int (default 100, max 1000)

### 4.3 Get Project

**Endpoint:** `GET /projects/{project_id}`

### 4.4 Update Project

**Endpoint:** `PUT /projects/{project_id}`
**Request Body:** Same as Create, all fields optional.

### 4.5 Delete Project

**Endpoint:** `DELETE /projects/{project_id}`

---

## 5. Datasets API

### 5.1 List Datasets

**Endpoint:** `GET /datasets/`
**Auth Required:** Yes
**Query Parameters:** None supported in code. Returns all datasets for user.

### 5.2 Upload Dataset

**Endpoint:** `POST /datasets/upload`
**Auth Required:** Yes
**Content-Type:** `multipart/form-data`

**Form Data:**

- `file`: (Binary) CSV or JSON file (Max 100MB)
- `project_id`: (Text, Optional) UUID of project

**Success Response (200):**

```json
{
  "id": "uuid",
  "name": "filename.csv",
  "status": "uploaded",
  "row_count": 1000,
  "schema_data": { ... }
}
```

### 5.3 Get Dataset

**Endpoint:** `GET /datasets/{dataset_id}`

### 5.4 Download Dataset

**Endpoint:** `GET /datasets/{dataset_id}/download`
**Response:**

```json
{
  "download_url": "https://s3...",
  "expires_in": 3600
}
```

_Or binary file stream if local storage._

### 5.5 Profile Dataset (Create)

**Endpoint:** `POST /datasets/{dataset_id}/profile`
**Response:** Generates and returns detailed statistical profile.

### 5.6 Get Profile (Cached)

**Endpoint:** `GET /datasets/{dataset_id}/profile`
**Response:** Returns cached profile if available.

### 5.7 Detect PII (Regex)

**Endpoint:** `POST /datasets/{dataset_id}/pii-detection`
**Response:**

```json
{
  "pii_results": {
    "email": { "pii_type": "EMAIL_ADDRESS", "confidence": 0.98 }
  },
  "flagged_columns": ["email", "phone"]
}
```

### 5.8 Detect PII (Enhanced/LLM)

**Endpoint:** `POST /datasets/{dataset_id}/pii-detection-enhanced`
**Response:** Detailed risk analysis including indirect identifiers.

### 5.9 Get PII Flags

**Endpoint:** `GET /datasets/{dataset_id}/pii-flags`

### 5.10 Delete Dataset

**Endpoint:** `DELETE /datasets/{dataset_id}`

---

## 6. Generators API

### 6.1 List Generators

**Endpoint:** `GET /generators/`
**Query Parameters:** None supported.

### 6.2 Get Generator

**Endpoint:** `GET /generators/{generator_id}`

### 6.3 Create Generator (Training)

**Endpoint:** `POST /generators/dataset/{dataset_id}/generate`
**Auth Required:** Yes

**Query Parameters (NOT JSON Body):**

- `generator_type`: string (default "ctgan") - Options: `ctgan`, `tvae`, `timegan`, `dp-ctgan`, `dp-tvae`
- `num_rows`: int (optional)
- `epochs`: int (default 50)
- `batch_size`: int (default 500)
- `target_epsilon`: float (default 10.0) - For DP models
- `force`: bool (default false)

**Response (200):**

```json
{
  "message": "Generation queued",
  "generator_id": "uuid",
  "job_id": "uuid",
  "task_id": "uuid"
}
```

### 6.4 Start Generation (Inference)

**Endpoint:** `POST /generators/{generator_id}/generate`
**Description:** Generate more data from an already trained generator.

### 6.5 Download Model

**Endpoint:** `GET /generators/{generator_id}/download-model`
**Response:** Returns S3 presigned URL.

### 6.6 DP Parameter Limits

**Endpoint:** `GET /generators/dp/parameter-limits/{dataset_id}`
**Query:** `target_epsilon` (float)
**Description:** Get valid range for epochs/batch_size for DP models.

### 6.7 Validate DP Config

**Endpoint:** `POST /generators/dp/validate-config`
**Query:** `dataset_id`, `generator_type`, `epochs`, `batch_size`, `target_epsilon`

### 6.8 Generate Model Card

**Endpoint:** `POST /generators/{generator_id}/model-card`
**Response:** Markdown content of model card.

### 6.9 Generate Compliance Report

**Endpoint:** `POST /generators/{generator_id}/compliance-report`
**Query:** `framework` (GDPR, HIPAA, CCPA, SOC2)

### 6.10 Generate Audit Narrative

**Endpoint:** `GET /generators/{generator_id}/audit-narrative`

### 6.11 Schema-Based Generation (No Training Required)

**Endpoint:** `POST /generators/schema/generate`
**Auth Required:** Yes
**Description:** Generate synthetic data directly from a schema definition without training on a dataset.

**Request Body:**

```json
{
  "columns": {
    "name": {
      "type": "string",
      "faker": "name"
    },
    "age": {
      "type": "integer",
      "min": 18,
      "max": 85
    },
    "email": {
      "type": "string",
      "faker": "email"
    },
    "salary": {
      "type": "float",
      "min": 30000,
      "max": 200000
    }
  }
}
```

**Query Parameters:**

- `num_rows`: int (default 1000)

**Response (200):**

```json
{
  "id": "uuid",
  "type": "schema",
  "status": "completed",
  "output_dataset_id": "uuid"
}
```

### 6.12 Get Privacy Report

**Endpoint:** `GET /generators/{generator_id}/privacy-report`
**Description:** Get privacy metrics for a DP-trained generator.

### 6.13 Download Model File (Direct)

**Endpoint:** `GET /generators/{generator_id}/download-model-file`
**Description:** Direct file download (vs presigned URL).

### 6.14 Get Recommended DP Config

**Endpoint:** `GET /generators/dp/recommended-config`
**Query Parameters:**

- `dataset_id`: UUID
- `privacy_level`: string ("low", "medium", "high", "very_high")

**Response:** Recommended epsilon, delta, epochs, batch_size for target privacy level.

---

## 7. Synthetic Datasets API

### 7.1 List Synthetic Datasets

**Endpoint:** `GET /synthetic-datasets/`
**Description:** Lists all datasets generated by models.

### 7.2 Get Synthetic Dataset

**Endpoint:** `GET /synthetic-datasets/{dataset_id}`

### 7.3 Download Synthetic Dataset

**Endpoint:** `GET /synthetic-datasets/{dataset_id}/download`

### 7.4 Delete Synthetic Dataset

**Endpoint:** `DELETE /synthetic-datasets/{dataset_id}`

---

## 8. Evaluations API

### 8.1 Run Evaluation

**Endpoint:** `POST /evaluations/run`
**Request Body:**

```json
{
  "generator_id": "uuid",
  "dataset_id": "uuid",
  "target_column": "optional_string",
  "sensitive_columns": ["col1", "col2"],
  "include_statistical": true,
  "include_ml_utility": true,
  "include_privacy": true
}
```

### 8.2 Get Evaluation

**Endpoint:** `GET /evaluations/{evaluation_id}`

### 8.3 List Evaluations for Generator

**Endpoint:** `GET /evaluations/generator/{generator_id}`

### 8.4 Quick Evaluation

**Endpoint:** `POST /evaluations/quick/{generator_id}`
**Description:** Fast statistical check only.

### 8.5 Explain Evaluation (AI)

**Endpoint:** `POST /evaluations/{evaluation_id}/explain`
**Response:** Natural language insights.

### 8.6 Assess Risk

**Endpoint:** `POST /evaluations/{evaluation_id}/assess-risk`
**Query:** `privacy_weight` (float, 0.0-1.0)

### 8.7 Get Risk Report

**Endpoint:** `GET /evaluations/{evaluation_id}/risk-report`
**Description:** Get cached risk assessment results.

### 8.8 Compare Evaluations

**Endpoint:** `POST /evaluations/compare`
**Request Body:**

```json
{
  "evaluation_ids": ["uuid1", "uuid2"]
}
```

---

## 9. LLM Chat & Features API

### 9.1 Chat

**Endpoint:** `POST /llm/chat`
**Request Body:**

```json
{
  "message": "How good is this data?",
  "evaluation_id": "optional_uuid",
  "generator_id": "optional_uuid",
  "history": []
}
```

### 9.2 Suggest Improvements

**Endpoint:** `POST /llm/suggest-improvements/{evaluation_id}`

### 9.3 Explain Metric

**Endpoint:** `GET /llm/explain-metric`
**Query:** `metric_name`, `metric_value`

### 9.4 Generate Features (Schema)

**Endpoint:** `POST /llm/generate-features`
**Description:** Use LLM to suggest new features based on schema.

### 9.5 Detect PII (LLM)

**Endpoint:** `POST /llm/detect-pii`
**Description:** Use LLM for advanced PII detection.

### 9.6 Generate Privacy Report (JSON)

**Endpoint:** `POST /llm/privacy-report`
**Description:** Generate privacy report as JSON (not PDF).

### 9.7 Generate Model Card (JSON)

**Endpoint:** `POST /llm/model-card`
**Description:** Generate model card as JSON/Markdown (not PDF).

### 9.8 Export Model Card

**Endpoints:**

- `POST /llm/model-card/export/pdf`
- `POST /llm/model-card/export/docx`
  **Request Body:**

```json
{
  "generator_id": "uuid",
  "dataset_id": "uuid"
}
```

**Query:** `save_to_s3` (bool)

### 9.9 Export Privacy Report

**Endpoint:** `POST /llm/privacy-report/export/pdf`

---

## 10. Exports API

### 10.1 List Exports

**Endpoint:** `GET /exports/`
**Query:** `limit`, `offset`, `export_type`, `format`, `generator_id`

### 10.2 Get Export

**Endpoint:** `GET /exports/{export_id}`

### 10.3 Download Export

**Endpoint:** `GET /exports/{export_id}/download`

### 10.4 Delete Export

**Endpoint:** `DELETE /exports/{export_id}`

---

## 11. Jobs API

### 11.1 List Jobs

**Endpoint:** `GET /jobs/`

### 11.2 Get Job

**Endpoint:** `GET /jobs/{job_id}`

### 11.3 Create Job

**Endpoint:** `POST /jobs/`
**Auth Required:** Yes
**Request Body:**

```json
{
  "project_id": "uuid",
  "type": "training",
  "dataset_id": "uuid",
  "generator_id": "uuid"
}
```

---

## 12. Billing API

### 12.1 List Usage Records

**Endpoint:** `GET /billing/usage`
**Auth Required:** Yes
**Description:** Get usage history for current user.

### 12.2 Record Usage

**Endpoint:** `POST /billing/usage`
**Auth Required:** Yes
**Request Body:**

```json
{
  "resource_type": "generation",
  "resource_id": "uuid",
  "quantity": 1000,
  "unit": "rows"
}
```

### 12.3 Get Usage Summary

**Endpoint:** `GET /billing/usage/summary`
**Auth Required:** Yes
**Query Parameters:**

- `start_date`: ISO date
- `end_date`: ISO date

### 12.4 List Quotas

**Endpoint:** `GET /billing/quotas`
**Auth Required:** Yes

### 12.5 Create Quota

**Endpoint:** `POST /billing/quotas`
**Auth Required:** Yes (Admin)

### 12.6 Update Quota

**Endpoint:** `PUT /billing/quotas/{quota_id}`
**Auth Required:** Yes (Admin)

### 12.7 Reset Quota

**Endpoint:** `POST /billing/quotas/{quota_id}/reset`
**Auth Required:** Yes (Admin)

### 12.8 Get Quota Status

**Endpoint:** `GET /billing/quotas/status`
**Auth Required:** Yes
**Description:** Check if user is within quota limits.

### 12.9 Get Billing Report

**Endpoint:** `GET /billing/report`
**Auth Required:** Yes
**Query Parameters:**

- `start_date`: ISO date
- `end_date`: ISO date

---

## 13. Audit API

### 13.1 List Audit Logs

**Endpoint:** `GET /audit/`
**Auth Required:** Yes
**Query Parameters:**

- `skip`: int
- `limit`: int
- `action`: string (filter by action type)
- `resource_type`: string

### 13.2 Get Audit Log

**Endpoint:** `GET /audit/{audit_log_id}`
**Auth Required:** Yes

### 13.3 Get User Audit Logs

**Endpoint:** `GET /audit/user/{user_id}`
**Auth Required:** Yes
**Description:** All audit logs for a specific user.

### 13.4 Get Resource Audit Logs

**Endpoint:** `GET /audit/resource/{resource_type}/{resource_id}`
**Auth Required:** Yes
**Description:** All audit logs for a specific resource (e.g., dataset, generator).

### 13.5 Get Audit Stats Summary

**Endpoint:** `GET /audit/stats/summary`
**Auth Required:** Yes
**Description:** Aggregated statistics of audit events.

---

## 14. Compliance API

### 14.1 List Compliance Reports

**Endpoint:** `GET /compliance/`
**Auth Required:** Yes

### 14.2 Create Compliance Report

**Endpoint:** `POST /compliance/`
**Auth Required:** Yes
**Request Body:**

```json
{
  "generator_id": "uuid",
  "framework": "GDPR",
  "report_data": {}
}
```

**Supported Frameworks:** `GDPR`, `HIPAA`, `CCPA`, `SOC2`

---

## 15. Error Handling

**400 Bad Request:** Invalid input (e.g., password too weak, missing fields).
**401 Unauthorized:** Missing or invalid Bearer token.
**403 Forbidden:** User does not own the resource.
**404 Not Found:** Resource ID does not exist.
**422 Validation Error:** Pydantic validation failure (wrong data type).
**500 Internal Server Error:** Unexpected server failure.
