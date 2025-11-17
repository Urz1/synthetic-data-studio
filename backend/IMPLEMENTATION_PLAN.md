# 🎯 Synthetic Data Studio - Core Implementation Plan

**Status**: PLAN MODE  
**Date**: November 17, 2025  
**Based on**: PRD v1.0 (Prd_Synth_Studio.md)  
**Target**: 12-week MVP with core functionalities

---

## 📊 Current State Assessment

### ✅ What We Have (Foundation ~40% Complete)
- FastAPI application with SQLModel/SQLAlchemy
- JWT authentication (registration, login, token verification)
- Basic project management
- Dataset upload/download (CSV, JSON)
- Schema-based random data generation (no ML)
- File storage in uploads/ directory
- Swagger API documentation
- SQLite database (development)

### ❌ What's Missing (Critical for MVP)
- **ML-based synthesis**: CTGAN, TimeGAN (REQ-GEN-001, REQ-GEN-002)
- **Differential Privacy**: DP-SGD integration (REQ-DP-001, REQ-DP-002)
- **Evaluation suite**: Statistical similarity, utility tests (REQ-EVAL-001, REQ-EVAL-002)
- **Privacy tests**: Membership inference, attribute inference (REQ-EVAL-003)
- **Compliance pack**: Model cards, DP reports, control mappings (REQ-COMP-001, REQ-COMP-002)
- **Data profiling**: PII detection, distribution analysis (REQ-DI-002, REQ-DI-003)
- **Audit logging**: Immutable provenance (REQ-COMP-003)
- **Background jobs**: Celery workers for long-running tasks
- **Time-series support**: Sequential data generation

---

## 🎯 Core Functionalities (MVP Priority)

Based on PRD requirements, we'll focus on **MUST-HAVE** items for 12-week MVP:

### Phase 1: Foundation & Data Pipeline (Weeks 1-2)
**Goal**: Solid data ingestion and profiling

1. **Enhanced Data Profiling** (REQ-DI-002)
   - Automatic type detection (currently basic)
   - Missing value analysis
   - Distribution visualization data
   - Outlier detection (IQR/Isolation Forest)
   - Correlation matrix
   
2. **PII/PHI Detection** (REQ-DI-003)
   - Heuristic detection for names, emails, SSNs, phone numbers
   - Flag sensitive columns
   - User confirmation flow

3. **Dataset Preprocessing Pipeline**
   - Standardized data cleaning
   - Type conversion utilities
   - Missing value handling strategies

### Phase 2: ML-Based Synthesis (Weeks 3-6)
**Goal**: Replace random generation with real ML models

4. **CTGAN Implementation** (REQ-GEN-001)
   - Install and integrate SDV library
   - CTGAN synthesizer with configurable hyperparameters
   - Training pipeline with progress tracking
   - Batch generation support
   - Model artifact storage
   
5. **TVAE Alternative** (REQ-GEN-001)
   - Variational Autoencoder option
   - Faster training for smaller datasets
   
6. **TimeGAN/RNN Time-Series** (REQ-GEN-002)
   - Sequential data generator
   - Timestamp preservation
   - Autocorrelation maintenance
   - Transaction/event log support

7. **Conditional Sampling** (REQ-GEN-003)
   - Generate based on column conditions
   - Rare event amplification
   - Stratified sampling support

### Phase 3: Differential Privacy (Weeks 7-8)
**Goal**: Privacy-preserving training

8. **DP-SGD Integration** (REQ-DP-001)
   - Opacus integration for PyTorch models
   - ε (epsilon) and δ (delta) parameter configuration
   - Privacy accountant tracking
   - Noise multiplier tuning
   
9. **DP Tuning & Reporting** (REQ-DP-002)
   - Grid search for optimal ε
   - Privacy-utility trade-off analysis
   - Automated DP report generation
   - Privacy budget tracking

### Phase 4: Evaluation & Quality (Weeks 8-9)
**Goal**: Rigorous quality assessment

10. **Statistical Similarity Suite** (REQ-EVAL-001)
    - KS-test for continuous features
    - Chi-square for categorical
    - Wasserstein distance
    - Correlation heatmap comparison
    - Marginal/joint distribution analysis
    - Jensen-Shannon divergence
    
11. **ML Utility Testing** (REQ-EVAL-002)
    - Train downstream models on synthetic data
    - Compare performance vs real data baseline
    - AUC, RMSE, F1 metrics
    - Utility delta reporting
    
12. **Privacy Leakage Tests** (REQ-EVAL-003)
    - Membership inference attacks
    - Attribute inference risk
    - Distance-to-closest-record (DCR)
    - Re-identification risk score

### Phase 5: Compliance & Reporting (Weeks 9-10)
**Goal**: Auto-generated compliance evidence

13. **Model Card Generator** (REQ-COMP-001)
    - Standardized model card (JSON + PDF)
    - Training data summary
    - Evaluation metrics
    - Intended uses and limitations
    - Reproducibility information
    
14. **Compliance Mapping Templates** (REQ-COMP-002)
    - HIPAA control mappings
    - GDPR compliance indicators
    - SOC-2 trust services mapping
    - Customizable templates
    - PDF generation
    
15. **Audit Logs & Provenance** (REQ-COMP-003)
    - Immutable append-only logs
    - Dataset upload tracking
    - Model version tracking
    - DP parameter logging
    - Hash checksums for verification
    - Export functionality

### Phase 6: Infrastructure & Polish (Weeks 11-12)
**Goal**: Production-ready deployment

16. **Background Job System**
    - Celery integration with Redis
    - Job queue management
    - Progress tracking
    - Email notifications
    
17. **API Enhancements** (REQ-API-001)
    - Complete REST API endpoints
    - API key authentication
    - Rate limiting
    - OpenAPI spec completion
    
18. **Security Hardening** (REQ-SEC-001)
    - Encryption at rest (AES-256)
    - TLS 1.2+ enforcement
    - Secrets in environment/KMS
    - API key revocation
    
19. **Usage Tracking** (REQ-OPS-001)
    - Compute time tracking
    - Storage usage
    - Job count per user
    - Billing meter

---

## 🏗️ Implementation Architecture

### Updated System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Application                      │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Projects │  │ Datasets │  │Generator │   │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Evaluation│  │Compliance│  │   Audit  │  │  Jobs    │   │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │       Core Services Layer             │
        │                                        │
        │  • Profiling Service                  │
        │  • PII Detection Service              │
        │  • Synthesis Service (CTGAN/TimeGAN) │
        │  • DP Service (Opacus)                │
        │  • Evaluation Service                 │
        │  • Model Card Service                 │
        └──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        ▼                                      ▼
┌──────────────────┐              ┌──────────────────┐
│  Celery Workers  │              │   PostgreSQL     │
│  (Background)    │              │   Database       │
│                  │              │                  │
│  • CTGAN Train   │              │  • Users         │
│  • Evaluation    │              │  • Datasets      │
│  • Report Gen    │              │  • Generators    │
└──────────────────┘              │  • Evaluations   │
        │                         │  • AuditLogs     │
        ▼                         └──────────────────┘
┌──────────────────┐
│  Model Registry  │
│   (MLflow)       │
│                  │
│  • Artifacts     │
│  • Metrics       │
│  • Versions      │
└──────────────────┘
```

### Key Technology Decisions

**ML Frameworks**:
- Primary: PyTorch (flexibility, Opacus support)
- SDV library: CTGAN, TVAE implementations
- TimeGAN: Custom implementation or YData-synthetic

**Privacy**:
- Opacus: DP-SGD for PyTorch
- Fallback: TensorFlow Privacy (if needed)

**Evaluation**:
- SciPy: Statistical tests
- Scikit-learn: ML utilities
- Custom: Privacy attack implementations

**Background Jobs**:
- Celery: Task queue
- Redis: Message broker
- PostgreSQL: Result backend

**Compliance**:
- ReportLab or WeasyPrint: PDF generation
- Jinja2: Template rendering
- JSON Schema: Model card standardization

---

## 📋 Detailed Implementation Checklist

### 🟢 PHASE 1: Data Pipeline Enhancement (Weeks 1-2)

#### Task 1.1: Advanced Data Profiling
- [ ] Create `app/services/profiling.py` service
- [ ] Implement type detection enhancement
- [ ] Add missing value analysis
- [ ] Create distribution statistics generator
- [ ] Implement outlier detection (IQR + Isolation Forest)
- [ ] Generate correlation matrices
- [ ] Create profiling report model
- [ ] Add API endpoint: `POST /datasets/{id}/profile`
- [ ] Store profiling results in database
- [ ] Unit tests for profiling service

#### Task 1.2: PII/PHI Detection
- [ ] Create `app/services/pii_detector.py`
- [ ] Implement regex patterns (email, SSN, phone, etc.)
- [ ] Add name detection heuristics
- [ ] Create PII flag model
- [ ] Add user confirmation workflow
- [ ] API endpoint: `GET /datasets/{id}/pii-flags`
- [ ] UI-friendly PII report format
- [ ] Tests with sample PII data

#### Task 1.3: Dataset Preprocessing
- [ ] Create `app/services/preprocessing.py`
- [ ] Implement data cleaning pipeline
- [ ] Add type conversion utilities
- [ ] Missing value strategies (drop, fill, interpolate)
- [ ] Standardization/normalization functions
- [ ] Column encoding utilities
- [ ] Integration with datasets module

**Deliverable**: Enhanced profiling + PII detection working end-to-end

---

### 🟠 PHASE 2: ML-Based Generation (Weeks 3-6)

#### Task 2.1: SDV Integration & CTGAN
- [ ] Install SDV: `pip install sdv`
- [ ] Create `app/services/synthesis/ctgan_service.py`
- [ ] Implement CTGAN wrapper with SDV
- [ ] Add hyperparameter configuration
- [ ] Implement training progress tracking
- [ ] Model artifact storage (MLflow or file-based)
- [ ] Update `app/generators/services.py` to use CTGAN
- [ ] Replace random generation with CTGAN
- [ ] Add GPU/CPU detection and fallback
- [ ] Batch generation support
- [ ] Error handling and recovery
- [ ] Unit tests with small datasets

#### Task 2.2: TVAE Implementation
- [ ] Create `app/services/synthesis/tvae_service.py`
- [ ] Implement TVAE with SDV
- [ ] Faster training optimization
- [ ] Small dataset handling
- [ ] Generator type selection in API
- [ ] Comparison tests (CTGAN vs TVAE)

#### Task 2.3: TimeGAN for Time-Series
- [ ] Research TimeGAN implementations (YData-synthetic)
- [ ] Install dependencies
- [ ] Create `app/services/synthesis/timegan_service.py`
- [ ] Implement sequential data handling
- [ ] Timestamp preservation logic
- [ ] Autocorrelation preservation
- [ ] Transaction log example dataset
- [ ] API endpoint: `POST /generators/dataset/{id}/timeseries`
- [ ] Tests with time-series data

#### Task 2.4: Conditional Sampling
- [ ] Implement conditional column filtering
- [ ] Rare event amplification logic
- [ ] Stratified sampling support
- [ ] API parameters for conditions
- [ ] Validation of condition syntax
- [ ] Tests with rare event datasets

**Deliverable**: CTGAN/TVAE/TimeGAN working with real synthesis quality

---

### 🔵 PHASE 3: Differential Privacy (Weeks 7-8)

#### Task 3.1: Opacus Integration
- [ ] Install Opacus: `pip install opacus`
- [ ] Create `app/services/privacy/dp_service.py`
- [ ] Implement DP-SGD wrapper for CTGAN
- [ ] Privacy accountant integration
- [ ] ε and δ parameter configuration
- [ ] Noise multiplier calculation
- [ ] Gradient clipping
- [ ] Privacy budget tracking
- [ ] API: enable DP flag in generator config
- [ ] Tests with privacy guarantees

#### Task 3.2: DP Tuning & Reporting
- [ ] Create `app/services/privacy/dp_tuning.py`
- [ ] Implement epsilon grid search
- [ ] Privacy-utility trade-off analyzer
- [ ] Create DP report model
- [ ] Generate DP report (JSON + PDF)
- [ ] API endpoint: `GET /generators/{id}/dp-report`
- [ ] Visualization data for trade-offs
- [ ] Tests with various epsilon values

**Deliverable**: DP-enabled training with reports

---

### 🟣 PHASE 4: Evaluation System (Weeks 8-9)

#### Task 4.1: Statistical Similarity Suite
- [ ] Create `app/services/evaluation/statistical_evaluator.py`
- [ ] Implement KS-test for continuous features
- [ ] Chi-square test for categorical
- [ ] Wasserstein distance calculator
- [ ] Correlation matrix comparison
- [ ] Marginal distribution comparison
- [ ] Joint distribution analysis
- [ ] Jensen-Shannon divergence
- [ ] Create evaluation report model
- [ ] API endpoint: `POST /datasets/{id}/evaluate`
- [ ] Store evaluation results
- [ ] Tests with synthetic vs real data

#### Task 4.2: ML Utility Testing
- [ ] Create `app/services/evaluation/utility_evaluator.py`
- [ ] Implement model training pipeline
- [ ] Support classification and regression
- [ ] Synthetic vs real training comparison
- [ ] Metric calculation (AUC, RMSE, F1)
- [ ] Utility delta reporting
- [ ] Configurable downstream task
- [ ] API endpoint: `POST /datasets/{id}/utility-test`
- [ ] Tests with sample tasks

#### Task 4.3: Privacy Leakage Tests
- [ ] Create `app/services/evaluation/privacy_evaluator.py`
- [ ] Implement membership inference attack
- [ ] Attribute inference risk scorer
- [ ] Distance-to-closest-record (DCR)
- [ ] Re-identification risk estimator
- [ ] Privacy risk report
- [ ] API endpoint: `POST /datasets/{id}/privacy-test`
- [ ] Tests with known attack scenarios

**Deliverable**: Complete evaluation suite with reports

---

### 🟡 PHASE 5: Compliance System (Weeks 9-10)

#### Task 5.1: Model Card Generator
- [ ] Create `app/services/compliance/model_card_service.py`
- [ ] Define model card JSON schema
- [ ] Implement model card builder
- [ ] Add training data summary
- [ ] Include evaluation metrics
- [ ] Document intended uses/limitations
- [ ] Reproducibility information
- [ ] PDF generation (ReportLab/WeasyPrint)
- [ ] API endpoint: `GET /generators/{id}/model-card`
- [ ] Tests with sample generators

#### Task 5.2: Compliance Templates
- [ ] Create `app/services/compliance/compliance_mapper.py`
- [ ] HIPAA control mapping template
- [ ] GDPR compliance template
- [ ] SOC-2 trust services template
- [ ] Jinja2 template files
- [ ] Dynamic content population
- [ ] PDF generation for each framework
- [ ] API endpoint: `GET /generators/{id}/compliance-pack`
- [ ] Customization options
- [ ] Tests with all templates

#### Task 5.3: Audit Logging System
- [ ] Enhance `app/audit/models.py`
- [ ] Implement append-only log writer
- [ ] Track all critical operations
- [ ] Hash checksum generation
- [ ] Provenance tracking
- [ ] Immutable storage strategy
- [ ] Export functionality (JSON/CSV)
- [ ] API endpoint: `GET /audit/logs`
- [ ] Query and filter capabilities
- [ ] Tests for immutability

**Deliverable**: Full compliance pack generation

---

### 🔴 PHASE 6: Production Readiness (Weeks 11-12)

#### Task 6.1: Celery Background Jobs
- [ ] Install Celery + Redis
- [ ] Create `workers/celery_app.py`
- [ ] Define task decorators
- [ ] CTGAN training as background task
- [ ] Evaluation as background task
- [ ] Report generation as background task
- [ ] Progress tracking mechanism
- [ ] Job status API: `GET /jobs/{id}/status`
- [ ] Email notifications (optional)
- [ ] Error handling and retries
- [ ] Tests with long-running tasks

#### Task 6.2: API Completion
- [ ] Complete all CRUD endpoints
- [ ] API key generation endpoint
- [ ] Rate limiting middleware
- [ ] Request validation enhancement
- [ ] OpenAPI spec completion
- [ ] API documentation examples
- [ ] Client SDK generation (optional)
- [ ] Tests for all endpoints

#### Task 6.3: Security Hardening
- [ ] Implement encryption at rest
- [ ] Force TLS 1.2+ in production
- [ ] Move secrets to environment variables
- [ ] API key revocation endpoint
- [ ] Input sanitization audit
- [ ] SQL injection prevention check
- [ ] CORS configuration review
- [ ] Security headers middleware
- [ ] Penetration testing checklist

#### Task 6.4: Usage Tracking & Billing
- [ ] Enhance `app/billing/models.py`
- [ ] Track compute time per job
- [ ] Track storage per user
- [ ] Job count metering
- [ ] Usage dashboard API
- [ ] Billing report generation
- [ ] Export functionality
- [ ] Tests with sample usage data

**Deliverable**: Production-ready MVP

---

## 🔧 Technology Stack Updates

### Required New Dependencies

```python
# ML & Synthesis
sdv>=1.0.0              # CTGAN, TVAE
ydata-synthetic         # TimeGAN alternative
opacus>=1.4.0          # Differential Privacy

# Evaluation
scipy>=1.11.0          # Statistical tests
scikit-learn>=1.3.0    # ML utilities
tensorflow-privacy     # Backup DP option

# Background Jobs
celery[redis]>=5.3.0   # Task queue
redis>=5.0.0           # Message broker

# Reporting
reportlab>=4.0.0       # PDF generation
weasyprint>=60.0       # Alternative PDF
Jinja2>=3.1.0          # Templates

# Model Registry
mlflow>=2.8.0          # Model tracking (optional)

# Monitoring
prometheus-client      # Metrics
```

---

## 📊 Database Schema Updates

### New Tables Required

```sql
-- Enhanced datasets table (add columns)
ALTER TABLE datasets ADD COLUMN profiling_data JSONB;
ALTER TABLE datasets ADD COLUMN pii_flags JSONB;

-- Evaluations table (implement)
CREATE TABLE evaluations (
    id UUID PRIMARY KEY,
    generator_id UUID REFERENCES generators(id),
    synthetic_dataset_id UUID REFERENCES datasets(id),
    real_dataset_id UUID REFERENCES datasets(id),
    statistical_metrics JSONB,
    utility_metrics JSONB,
    privacy_metrics JSONB,
    overall_score FLOAT,
    created_at TIMESTAMP
);

-- Model cards table
CREATE TABLE model_cards (
    id UUID PRIMARY KEY,
    generator_id UUID REFERENCES generators(id),
    card_data JSONB,
    pdf_path TEXT,
    created_at TIMESTAMP
);

-- Compliance reports table
CREATE TABLE compliance_reports (
    id UUID PRIMARY KEY,
    generator_id UUID REFERENCES generators(id),
    framework TEXT, -- HIPAA, GDPR, SOC2
    report_data JSONB,
    pdf_path TEXT,
    created_at TIMESTAMP
);

-- Enhanced audit logs
ALTER TABLE audit_logs ADD COLUMN checksum TEXT;
ALTER TABLE audit_logs ADD COLUMN provenance_data JSONB;

-- Usage tracking
ALTER TABLE usage_records ADD COLUMN compute_minutes INTEGER;
ALTER TABLE usage_records ADD COLUMN storage_gb FLOAT;
```

---

## 🎯 Success Criteria (MVP Acceptance)

### Must Pass All:

1. ✅ **End-to-End Flow**: Upload → Profile → Synthesize (CTGAN) → Evaluate → Compliance Pack
2. ✅ **Statistical Quality**: KS-test p-value > 0.05 for 80% of features
3. ✅ **ML Utility**: Downstream model performance within 10-20% of baseline
4. ✅ **DP Functionality**: DP-enabled generation with ε report
5. ✅ **Compliance Pack**: Auto-generated model card + HIPAA/GDPR/SOC-2 mappings + DP report
6. ✅ **API Complete**: All documented endpoints working with auth
7. ✅ **Security**: No plaintext secrets, encryption at rest, TLS enforced
8. ✅ **Performance**: 10k row generation < 30 minutes
9. ✅ **Tests**: >70% code coverage, all critical paths tested

---

## 📅 Execution Timeline

### Week-by-Week Breakdown

| Week | Phase | Focus | Key Deliverables |
|------|-------|-------|-----------------|
| 1-2 | Phase 1 | Data Pipeline | Profiling + PII Detection |
| 3-4 | Phase 2 | CTGAN/TVAE | ML-based synthesis working |
| 5-6 | Phase 2 | TimeGAN + Conditional | Time-series + rare events |
| 7 | Phase 3 | DP Integration | Opacus + DP-SGD |
| 8 | Phase 3 + 4 | DP Reports + Eval Start | DP tuning + Statistical tests |
| 9 | Phase 4 | Evaluation Suite | Utility + Privacy tests |
| 10 | Phase 5 | Compliance | Model cards + Templates |
| 11 | Phase 6 | Background Jobs | Celery + Redis |
| 12 | Phase 6 | Polish + Deploy | Security + MVP launch |

---

## 🚦 Risk Mitigation

### Technical Risks

1. **CTGAN Training Instability**
   - Mitigation: Start with small datasets, tune hyperparameters, have TVAE fallback
   
2. **DP Performance Degradation**
   - Mitigation: Implement tuning grid search, document trade-offs clearly
   
3. **Compute Cost Overruns**
   - Mitigation: Use spot instances, CPU fallback, caching, quotas
   
4. **Data Quality Issues**
   - Mitigation: Robust preprocessing, validation, error handling

### Project Risks

1. **Scope Creep**
   - Mitigation: Stick to MUST-HAVE requirements, defer SHOULD/MAY to Phase 2
   
2. **Timeline Slippage**
   - Mitigation: Weekly checkpoints, MVP-first mindset, cut non-critical features

---

## 📝 Next Steps (Build Mode Preparation)

### Before Starting Build Mode:

1. **Review and Approve This Plan**
   - Confirm priorities
   - Adjust timeline if needed
   - Sign off on scope

2. **Environment Setup**
   - Install all new dependencies
   - Set up Redis for Celery
   - Configure PostgreSQL (switch from SQLite)
   - Set up MLflow (optional)

3. **Create Branch Strategy**
   - Main branch: stable
   - Develop branch: integration
   - Feature branches: per phase/task

4. **Set Up Testing Framework**
   - pytest configuration
   - Test data fixtures
   - CI/CD pipeline (GitHub Actions)

---

## ✅ Approval Checklist

Before moving to BUILD MODE, confirm:

- [ ] PRD thoroughly understood
- [ ] Current codebase assessed
- [ ] Implementation plan reviewed
- [ ] Priorities aligned with MVP goals
- [ ] Timeline realistic (12 weeks)
- [ ] Technology choices approved
- [ ] Resource requirements clear
- [ ] Risk mitigation strategies acceptable

---

**STATUS**: ⏸️ WAITING FOR APPROVAL TO ENTER BUILD MODE

Once approved, we'll begin with Phase 1, Task 1.1: Advanced Data Profiling Service.

