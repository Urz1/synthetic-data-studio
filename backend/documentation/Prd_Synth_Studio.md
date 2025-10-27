# PRD — Synthetic Data Studio (Ultimate v1.0)

**Author**: Product Team (You / Solo Developer)

**Date**: 2025-09-29

**Status**: Final (iterative) — read through, then proceed to schema & wireframes.

---

## 0. Executive summary (one-liner)

Give seed-stage regulated startups a hyper-realistic, privacy-safe synthetic twin of their sensitive dataset plus an audit-accelerator compliance packet (HIPAA/GDPR/SOC-2 mapping, DP report, model-card, provenance) so they can run pilots with hospitals, banks, or regulators in days instead of months.

This product doubles as a hands-on ML/DL lab for the builder: you will implement and evaluate real generative models, differential privacy techniques, and rigorous privacy/utility testing.

---

## 1. Goals & success metrics (OKRs)

**Objectives**

- **O1**: Deliver a working MVP within 12 weeks that produces usable synthetic datasets from small samples and an auto-generated compliance pack.
- **O2**: Validate the product with at least 2 paying pilot customers (design partners) within 90 days of MVP launch.
- **O3**: Demonstrate learning outcomes — you (the developer) must complete at least 3 full model cycles (train/evaluate/tune) for tabular, time-series, and DP settings.

**Key results / success metrics**

- **K1 (Technical)**: Synthetic dataset passes statistical similarity thresholds: 80-95% for selected metrics (see Evaluation section). Utility of models trained on synthetic data within 10-20% of baseline trained on real data for defined tasks.
- **K2 (Privacy)**: DP epsilon report available; typical tuned ɛ results in acceptable utility (empirical). No major re-identification in membership inference tests in PoC.
- **K3 (Business)**: At least 2 paying pilots (≥ $5k each) or 5 unpaid but active design partners who complete CISO reviews using the pack within 3 months.
- **K4 (Product)**: Upload → synthetic export end-to-end latency <= 30 minutes for typical dataset 1-50k rows (MVP target).

---

## 2. Stakeholders & users

**Primary users (ICP)**

- Seed-stage health startups integrating with hospitals (EHRs / FHIR). 5–50 employees, pre-Series A, need pilot/POC.
- Seed-stage fintechs integrating with banks/PSPs, needing sanitized transaction data for demos and model dev.

**Secondary users**

- Data scientists/ML engineers in SMEs who need safe data for prototyping.
- Educators and bootcamps looking for hands-on synthetic datasets for training.

**Internal stakeholders**

- Solo developer (primary implementer).
- Advisory compliance/legal (contracted or freelance).
- Future BD / compliance partner (outsourced initially for attestation letters).

---

## 3. Problem statement & validated pain (concise)

Startups must show secure data handling before hospitals/banks will run a pilot. Formal audits (SOC-2 Type II, HIPAA attestation processes) are expensive and slow (months, tens to hundreds of thousands USD). This stalls pilots and kills momentum. A credible synthetic dataset + an audit-accelerator pack lowers friction for security reviews and pilot approvals.

**Assumptions (to be validated continuously):**

- Buyers will accept a synthetic dataset + supporting reports as sufficient evidence to approve a pilot (not to replace formal audits).
- Seed-stage buyers have budgets to pay $5k-30k for pilot acceleration.
- Design partners will provide small samples (anonymized/extracted) for synthesis and allow post-pilot feedback.

---

## 4. Value proposition

**For startups (primary):** Run pilots faster — hand CISOs an evidence pack that reduces review cycles and shows your product can be tested without exposing PII/PHI.

**For developer (you):** A rigorous ML/DL engineering project that forces mastery of generative modeling (CTGAN/TVAE/TimeGAN/diffusion), differential privacy, model evaluation, and deployment.

**For educators:** Reusable lab notebooks and explainable visualizations for teaching privacy-utility trade-offs.

---

## 5. Scope — in and out

**In-scope (MVP)**

- Tabular synthetic engine (CTGAN or similar; PyTorch-based).
- Time-series generator for transactional/visit logs (TimeGAN / RNN-diffusion baseline).
- Core differential privacy support (Empirical DP report via Opacus / TF-Privacy).
- Data profiling & EDA dashboard (distribution plots, correlation matrix).
- Compliance pack generator (templated HIPAA/GDPR/SOC-2 mapping PDF + model-card JSON).
- Single-tenant web UI (React/Streamlit) + simple REST API (FastAPI).
- Local / prototype deployment (HF Spaces / Render / small VM).

**Out-of-scope (v1)**

- Full SOC-2/HIPAA third-party attestation or certification.
- Multi-region enterprise-grade VPC and SSO (Phase 2).
- Large-scale image/text multimodal models (Phase 2+).
- Marketplace of paid synthetic datasets (Phase 2+).

---

## 6. Functional requirements (detailed)

Each requirement has: ID, description, acceptance criteria, priority (MUST / SHOULD / MAY), and owner.

### 6.1 Data ingestion & profiling

- **REQ-DI-001 (MUST)** - File upload - Accept CSV/Excel/JSON via web UI and REST API. Files up to 50MB (MVP); support chunked uploads for larger.
  - Accept optional schema mapping inputs for column types.
  - **Acceptance:** Upload succeeds; file validated; preview (first 100 rows) displayed.

- **REQ-DI-002 (MUST)** - Data validation & profiling - Automatic type detection, missing value summary, unique counts, distribution plots for numeric & categorical.
  - Outlier and anomaly detection (IQR or isolation forest).
  - **Acceptance:** Profiling report generated and available before synthesis starts.

- **REQ-DI-003 (SHOULD)** - PII/PHI detector - Heuristic detection of likely PII/PHI columns (names, SSNs, phone numbers, national IDs) and flagging for user confirmation.
  - **Acceptance:** Flags shown in UI with suggested redaction steps.

### 6.2 Generator core

- **REQ-GEN-001 (MUST)** - Tabular generator - Provide CTGAN / TVAE baseline with configurable hyperparameters (rows, epochs, batch size, latent_dim).
  - **Acceptance:** Synthetic dataset produced with requested row count and downloadable as CSV.

- **REQ-GEN-002 (MUST)** - Time-series generator - Implement TimeGAN or RNN-based generator for sequences (transactions, visits). Maintain timestamp alignment.
  - **Acceptance:** Synthetic time-series delivered with preserved temporal patterns (autocorrelation similar to real dataset within tolerance).

- **REQ-GEN-003 (SHOULD)** - Conditional sampling & rare-event amplification - Allow conditional sampling on columns (e.g., generate records only for `location = X`) and amplify rare event frequency by a factor (configurable) for stress tests.
  - **Acceptance:** Conditional sampling returns records matching condition; rare-event frequency is adjusted and documented.

- **REQ-GEN-004 (MAY)** - Lightweight LLM-based textual synthesis - For structured text fields, use simple LLM prompts or GPT-style fine-tuning (optional).
  - **Acceptance:** Generated text is coherent and anonymized (MVP: rule-based redaction recommended instead).

### 6.3 Privacy & DP module

- **REQ-DP-001 (MUST)** - DP-enabled training option - Provide option to enable DP-SGD during model training (Opacus/TensorFlow-Privacy). Accept ε and δ inputs or use a tuning mode.
  - **Acceptance:** If DP enabled, a privacy accountant output available and included in the compliance pack.

- **REQ-DP-002 (MUST)** - DP tuning & reporting - Empirical tuning flow: run grid search on ε (or adaptive search) to identify smallest ε that retains target utility metric (user-defined). Produce DP report (ε, δ, sampling rate, noise multiplier).
  - **Acceptance:** DP report generated, with logs for reproducibility.

### 6.4 Evaluation & metrics

- **REQ-EVAL-001 (MUST)** - Statistical similarity suite - KS-test for continuous features, Chi-square for categorical, Wasserstein distance for distributions, pairwise correlation heatmap comparison, marginal & joint distribution checks.
  - **Acceptance:** Evaluation JSON + dashboard with numerical scores and visualizations.

- **REQ-EVAL-002 (MUST)** - ML utility test - Train a simple downstream model (user-defined task or default classifier/regressor) on synthetic data and measure performance on a hold-out real test set if provided. Report delta vs model trained on real data.
  - **Acceptance:** Utility report with metrics (AUC, RMSE, F1, etc.) and delta percentage.

- **REQ-EVAL-003 (SHOULD)** - Privacy leakage tests - Membership inference tests and attribute inference risk estimates (using standard attacks or proxies).
  - **Acceptance:** Risk assessment and recommended mitigations included in the pack.

### 6.5 Compliance & reporting

- **REQ-COMP-001 (MUST)** - Model-card generator - Produce a standardized model-card (JSON + PDF) with model description, training data summary, evaluation metrics, privacy settings, intended uses, limitations.
  - **Acceptance:** Model-card downloadable; includes provenance metadata and reproducibility notes.

- **REQ-COMP-002 (MUST)** - Compliance mapping templates - Generate templated control mappings for HIPAA/GDPR/SOC-2 indicating how synthetic data reduces specific risk controls and what organizational controls remain required.
  - **Acceptance:** Template produced and customizable; includes recommendations for legal/disclosure steps.

- **REQ-COMP-003 (SHOULD)** - Audit log & provenance - Immutable record (append-only) of dataset upload, transform steps, model versions, DP parameters, and dataset export with timestamps and hash checksums.
  - **Acceptance:** Exportable audit log that can be attached to vendor review materials.

### 6.6 UX, API & export

- **REQ-UX-001 (MUST)** - Upload → generate → download flow - Minimal steps: upload, select template/domain, generator settings (rows, privacy), run job, preview, download.
  - **Acceptance:** End-to-end flow works in UI and via API.

- **REQ-API-001 (MUST)** - REST API endpoints - `POST /api/v1/upload`, `POST /api/v1/synthesize`, `GET /api/v1/jobs/{id}/status`, `GET /api/v1/jobs/{id}/download` - API key-based authentication.
  - **Acceptance:** API documented with OpenAPI spec and sample client.

- **REQ-SEC-001 (MUST)** - Auth & access control - API keys, basic user account, role-based access for admin vs user. Secrets stored in KMS.
  - **Acceptance:** Basic auth flows implemented; keys revocable.

### 6.7 Admin, billing & operations

- **REQ-OPS-001 (SHOULD)** - Usage tracking & billing meter - Track compute time, GB generated, and jobs per account. Provide simple billing statements (for pilot invoices).
  - **Acceptance:** Usage dashboard with billing estimates.

- **REQ-OPS-002 (MAY)** - On-prem / VPC deployment option - Allow exportable docker-compose/k8s manifests for customers who need on-prem runs (Phase 2).
  - **Acceptance:** Not required for MVP.

---

## 7. Non-functional requirements (NFRs)

- **Security & privacy**
  - NFR-SEC-001: Encryption at rest & in transit (TLS1.2+; AES-256 at rest).
  - NFR-SEC-002: Keys & secrets managed via KMS; no long-term plaintext storage of customer keys.
  - NFR-SEC-003: Soft-delete & retention policy for uploaded datasets (default 30 days, configurable).

- **Reliability & performance**
  - NFR-RUN-001: MVP availability target 95% (hosted prototype).
  - NFR-RUN-002: Typical job (≤10k rows) median latency < 30 minutes; background queue for heavier jobs.

- **Scalability & cost**
  - NFR-COST-001: Use spot instances where possible; cache template outputs to avoid repeated compute.
  - NFR-COST-002: Design pipeline to run on CPU as fallback; GPU used for heavy training only.

- **Compliance & legal**
  - NFR-LGL-001: Include clear disclaimers: synthetic outputs are **not** a legal audit nor a substitute for formal certifications — they are an accelerator to evidence for pilots.

---

## 8. Data schema (high-level sample & examples)

Note: The full schema work will be produced in the next deliverable. These are illustrative schemas to drive the PRD and wireframe decisions.

### 8.1 Sales / SMB transactions (CSV example)

```json
{
  "order_id": "string",
  "customer_id": "string",
  "item_id": "string",
  "category": "string",
  "quantity": "integer",
  "price": "float",
  "currency": "string",
  "timestamp": "ISO8601",
  "store_id": "string",
  "payment_method": "enum",
  "loyalty_member": "boolean"
}
```

### 8.2 Healthcare (FHIR-inspired simplified)

```json
{
  "patient_id": "string",
  "age": "integer",
  "sex": "string",
  "encounters": [
    {
      "encounter_id": "string",
      "timestamp": "ISO8601",
      "department": "string",
      "diagnosis_codes": ["ICD10"],
      "lab_results": [{"test": "string", "value": "float", "unit": "string"}],
      "treatment": "string"
    }
  ],
  "outcome": "enum"
}
```

### 8.3 Fintech transactions

```json
{
  "txn_id": "string",
  "account_id": "string",
  "merchant": "string",
  "amount": "float",
  "currency": "string",
  "timestamp": "ISO8601",
  "country": "string",
  "merchant_category": "string",
  "is_fraud": "boolean (label, optional)"
}
```

---

## 9. Edge cases & how to handle them (exhaustive focus)

1. **Tiny datasets (<100 rows)**
    - **Strategy:** Use domain priors, bootstrap augmentation, conditional sampling, and pre-trained vertical priors if available. Warn user about reduced utility.
2. **High-cardinality categorical features (IDs, names)**
    - **Strategy:** Hash/encode categories or map to frequency bins; optionally synthesize surrogate tokens.
3. **Unique/rare identifiers**
    - **Strategy:** Remove/replace with synthetic surrogate IDs; ensure no exact matches with real IDs.
4. **Skewed/imbalanced labels (rare events)**
    - **Strategy:** Rare-event amplification module & conditional sampling; synthetic oversampling with constraints.
5. **Nested JSON & complex schemas (FHIR, EDC)**
    - **Strategy:** Flatten for tabular modeling or build hierarchical/time-series pipelines; document limitations.
6. **Missing timestamps or inconsistent timezones**
    - **Strategy:** Normalize timezone to UTC; interpolate or tag missing timestamps; expose as user settings.
7. **Adversarial inputs (poisoned uploads)**
    - **Strategy:** Validation, anomaly detection, quotas, and manual review for high-sensitivity customers.
8. **Regulatory changes**
    - **Strategy:** Quarterly review cycle with advisory board and update templates; versioned compliance packs.
9. **Customer misuse (re-identification attempts)**
    - **Strategy:** Terms of service forbidding re-identification, technical limits (no export of synthetic rows that are too close to originals), and risk report flagging.

---

## 10. Privacy / Compliance specifics & legal positioning

**What we provide**

- Technical evidence (DP report, model-card, provenance log) that a dataset is synthetic and used privacy-preserving techniques.
- Mapping of what controls are satisfied and which organizational controls remain (we do not claim to issue legal attestation).

**What we do NOT provide (important)**

- A legal certificate (we are not a replacement for third-party SOC-2/HIPAA audits).
- Legal advice — customers should consult counsel for binding attestations.

**Suggested compliance pack contents (MVP)**

- Synthetic dataset (CSV/JSON) with metadata.
- Model-card (JSON + PDF).
- DP report (ε, δ, noise multiplier, sampling rate).
- Evaluation report (stat/utility/leakage tests).
- Control mapping (templated) for HIPAA/GDPR/SOC-2.
- Immutable provenance log (job id, timestamps, model hash, user id).

**Presentation tips for customers**

- Provide a one-page executive summary: what was input, which models used, why synthetic is safe, and suggested limitations/next steps (pilot scope).
- Offer optional small attestation letter via compliance partner (paid add-on).

---

## 11. ML lifecycle, reproducibility & auditability

- Use a model registry (lightweight — file-based or MLflow) to store model artifacts, hyperparameters, and metrics.
- Each synth job must record: dataset hash, training seed, model version, DP params, job logs.
- Repro notebook available for each synthetic dataset to allow reviewers to re-run experiments (with legal safeguards).

---

## 12. Testing & validation plan

- **Unit tests:** data parsers, input validation, UI components.
- **Integration tests:** end-to-end generation flow, API contract tests.
- **Model tests:** deterministic training runs for small datasets, metric regression tests.
- **Security tests:** static code analysis, dependency checks, penetration testing before pilot with real customers.
- **Privacy tests:** membership inference, attribute inference, re-identification score run on PoC datasets.

---

## 13. Monitoring, logging & alerting

- Job queue & worker monitoring (Prometheus/Grafana).
- Model performance drift alerts (when utility metrics change beyond threshold).
- Privacy budget exhaustion tracking (if offering DP budget across multiple jobs).
- Automated audit logs exportable per customer.

---

## 14. Architecture & infra (high-level)

**Components**

- Web UI (React or Streamlit).
- API gateway (FastAPI).
- Worker pool (Celery/RQ) with containerized model training tasks (Docker).
- Model storage & registry (S3 or equivalent + MLflow).
- Database (Postgres) for metadata.
- Secrets & keys in KMS.
- Monitoring stack (Prometheus + Grafana).

**Compute**

- Training on GPU for heavy models (spot instances).
- Fall back to CPU for small jobs.

**Deployment (MVP)**

- Single-tenant hosted on a cloud provider or HF Spaces for prototyping.
- Option to export Docker manifests for local runs.

---

## 15. 12-Week roadmap (detailed week-by-week)

- **Week 0 (Prep)** - Finalize PRD (this document). Prepare repo, choose stack, initial infra budget. Acquire Synthea, example datasets.

- **Weeks 1-2 (Data ingestion & profiling)** - Implement file upload, profiling, schema detection, PII/PHI heuristics.
  - **Deliverable:** UI upload + profiling page; tests.

- **Weeks 3-4 (Tabular generator — baseline)** - Implement CTGAN baseline pipeline with simple UI knobs; produce synthetic CSV.
  - **Deliverable:** working generator for SMB Sales dataset; evaluation scripts.

- **Weeks 5-6 (Time-series & conditional sampling)** - Implement TimeGAN or RNN baseline for sequences; add conditional sampling & rare-event amplification.
  - **Deliverable:** synthetic time-series generator + docs.

- **Weeks 7-8 (DP & evaluation suite)** - Integrate Opacus/TF-Privacy DP options; implement statistical & utility evaluation tests and model-card generator.
  - **Deliverable:** DP reporting + evaluation dashboard.

- **Weeks 9-10 (Compliance pack & audit logs)** - Auto-generate compliance pack (templated PDFs), provenance logs, executive summary.
  - **Deliverable:** full compliance pack export.

- **Weeks 11-12 (Polish, deploy & pilot outreach)** - Deploy MVP, create pilot offer & outreach emails, onboard 2 design partners. Shipping + doc.
  - **Deliverable:** live MVP and pilot sign-ups.

---

## 16. MVP acceptance criteria

All must be satisfied for MVP release:

1. **End-to-end:** upload sample → produce synthetic dataset → auto-generated compliance pack.
2. **Evaluation:** statistical similarity and utility test executed with results.
3. **DP:** DP-optional path available; a DP report is generated when chosen.
4. **API:** documented `synthesize` endpoint working.
5. **Security:** data retention & encryption implemented; no plaintext secrets.
6. **Pilot:** at least 1 signed design partner or documented interest with contact details.

---

## 17. Go-to-market & pilot plan (MVP phase)

**Pilot offer (design partner)** - 4-6-week pilot priced at $5k-15k (discounted); includes: 2 synthetic datasets, compliance pack, one integration support call, and feedback session.

**Outreach channels** - Personal network (YC, health startups), LinkedIn outreach targeted to CTO/Founder/CISO, compliance meetups.

- **Content:** 3 technical blog posts showing DP tuning + model cards, and 2 case studies from pilots.

**Partnerships** - Compliance automation vendors (Vanta/Drata) for cross-referral.

- Small compliance law shop for a low-cost attestation letter paid as add-on.

---

## 18. Pricing & unit economics (initial thinking)

- **Pilot pricing:** $5k-15k one-off (design partner).
- **Early SaaS:** $20-100/mo for SMB self-serve with limits; enterprise Tier (seed-stage startups to mid-market) $2k-30k/yr depending on usage and compliance add-ons.
- **Key levers:** pricing for compliance add-ons, on-prem deployments (higher price), attestation letter cost recovery.

---

## 19. Risks & mitigations (top items)

1. **Regulatory misrepresentation** — mitigate with clear disclaimers and partner attestation option.
2. **Re-identification risk** — rigorous evaluation suite, conservative defaults, and legal TOS forbidding abuse.
3. **Cost of compute** — cost control via caching & pre-generated templates; tiered pricing.
4. **Customer acceptance** — run design partner pilots and gather CISO feedback; adjust claims accordingly.
5. **Competition** — niche vertically (healthcare clinical trials, fintech payments) and compliance-first messaging to differentiate.

---

## 20. Legal & ethical policy (MVP)

- **Terms of Service:** require customers to declare data ownership and lawful rights to upload.
- **Privacy Policy:** describe retention, deletion, and data handling.
- **Acceptable Use:** ban uses that facilitate human rights abuses, fraud, or unlawful surveillance.
- **Data Processing Agreement (DPA):** template for pilot customers.

---

## 21. Appendices

**A. Glossary:** DP (Differential Privacy), FHIR, SOC-2, CTGAN, TimeGAN, Synthea, model-card.

**B. Tools & libs (suggested):** PyTorch, SDV/CTGAN, TimeseriesGAN/TimeGAN code, Opacus, TensorFlow-Privacy, Synthea (FHIR), FastAPI, React/Streamlit, MLflow, Great Expectations.

**C. Example compliance pack outline (MVP)**

1. Executive summary (1 page)
2. Synthetic dataset (CSV/JSON) + README
3. Model-card PDF/JSON
4. DP report (parameters & accountant output)
5. Evaluation report (stats & utility)
6. Control mapping (HIPAA/GDPR/SOC-2)
7. Audit log & job provenance (JSON)

---

## 22. Versioning & iterative process

- **Version 1.0 (this doc)** — Ultimate MVP PRD.
- **Planned iterations:** Weekly sprints with retrospective; bi-weekly product demos; release candidate at week 12.
- **Change log:** Keep a `PRD/CHANGELOG.md` in the repo for future edits.

---

**Closing note**

This PRD is intentionally detailed to serve as the single source of truth for the next 12 weeks of work. It balances a narrow, achievable MVP (for a solo developer) with non-trivial, real ML/DL work that will teach and showcase deep technical skills. After you review this, I will produce the **detailed JSON schemas, ERD, and Figma wireframe spec** as the next deliverables.
