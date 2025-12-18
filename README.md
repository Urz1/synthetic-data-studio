# Synth Studio 🧪🔒

**Privacy-first synthetic data generation platform for healthcare and fintech startups**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-000000)](frontend/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB)](backend/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)](frontend/)

## 🚀 Quick Start

**No hardcoded URLs!** Everything is environment-based for easy local development.

### Local Development

```bash
# Frontend
cd frontend
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000
pnpm install && pnpm dev

# Backend
cd backend
cp .env.example .env
# Edit .env: FRONTEND_URL=http://localhost:3000
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**That's it!** Frontend at http://localhost:3000, Backend at http://localhost:8000

📖 Full guide: [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)

---

## 🎯 Overview

Synth Studio enables regulated startups to generate high-fidelity, privacy-safe synthetic data with differential privacy guarantees. Built for healthcare (HIPAA) and fintech (SOC-2/GDPR) compliance, it accelerates pilot approvals and security reviews without exposing sensitive PII/PHI.

**Perfect for:**
- Healthcare startups needing synthetic EHR/FHIR data
- Fintech companies requiring transaction data for testing
- Enterprises sharing data across departments safely
- ML teams training models without privacy risks

## ✨ Key Features

- **🔒 Differential Privacy**: Mathematical privacy guarantees with RDP accounting (ε < 1-10, δ = 1e-5)
- **🤖 AI-Powered**: Interactive chat assistant for guidance and automation
- **📊 Quality Assurance**: Comprehensive evaluation suite with statistical and ML utility tests
- **🛡️ Compliance Ready**: HIPAA, GDPR, CCPA, SOC-2 compliance reporting
- **🔬 Multiple Methods**: CTGAN, TVAE, GaussianCopula, and privacy-preserving variants
- **⚡ Production-Grade**: <1s load times, optimized bundles, edge caching
- **♿ Accessible**: WCAG 2.1 AA compliant with full keyboard navigation
- **🌓 Modern UI**: React 19, Next.js 16, shadcn/ui with dark mode
  - Immutable audit logs and provenance records
- **Intelligent Data Ingestion & Profiling:** Automated schema detection, PII/PHI identification, and comprehensive data profiling dashboards with distribution plots and correlation matrices.
- **User-Friendly Interface & Robust API:** Interact with the studio via an intuitive web UI (React/Streamlit) or programmatically through a well-documented REST API (FastAPI).
- **Focused on Regulated Industries:** Tailored for health tech (EHRs/FHIR) and fintech (transaction data), ensuring relevance and compliance from day one.
- **⚡ Production-Grade Performance:** Zero-latency optimizations deliver <1s load times with 70-90% bandwidth savings through edge caching, preconnect strategies, and optimized bundle splitting.

## 💡 Value Proposition

- **For Startups:** Accelerate pilot approvals by providing CISOs with a credible evidence pack that reduces security review cycles and proves product safety without exposing PII/PHI.
## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend Layer (Next.js 16)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Dashboard UI │  │ Dataset Mgmt │  │  AI Assistant │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Admin Portal │  │ Auth System  │  │  Evaluations  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                              │ REST API (JWT Auth)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend Layer (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Auth Service │  │ Dataset API  │  │  Job Manager  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ ML Generators│  │ Evaluation   │  │ LLM Assistant │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │   AWS S3     │
│   Database   │    │ Cache/Queue  │    │ File Storage │
└──────────────┘    └──────────────┘    └──────────────┘
         │                    │
         ▼                    ▼
┌──────────────────────────────────────┐
│      Celery Workers (Background)     │
│  - Synthetic Data Generation         │
│  - Quality Evaluations               │
│  - Compliance Report Generation      │
└──────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 16.0.3 (App Router, React 19)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x, shadcn/ui components
- **UI Components**: Radix UI primitives (Dropdown, Dialog, Tabs, etc.)
- **State Management**: React Context API, TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **HTTP Client**: Axios with interceptors
- **Authentication**: JWT tokens stored in localStorage

#### Backend
- **Framework**: FastAPI 0.100+ (async/await support)
- **Language**: Python 3.9+
- **ORM**: SQLAlchemy 2.x with async support
- **Database**: PostgreSQL 13+ (primary data store)
- **Cache/Queue**: Redis 7+ (Celery broker + result backend)
- **Task Queue**: Celery 5.x (distributed task processing)
- **Authentication**: JWT (python-jose), OAuth2 (Google, GitHub)
- **Migrations**: Alembic (database version control)
- **API Docs**: OpenAPI/Swagger (auto-generated)

#### ML & Privacy
- **Synthetic Data**: SDV (Synthetic Data Vault) 1.x
- **Generators**: CTGAN, TVAE, GaussianCopula
- **Privacy**: Opacus (differential privacy for PyTorch)
- **Privacy Accounting**: Rényi Differential Privacy (RDP)
- **Data Processing**: Pandas, NumPy
- **ML Evaluation**: Scikit-learn metrics

#### Infrastructure
- **Storage**: AWS S3 (dataset uploads, generated files)
- **Frontend Hosting**: Vercel (edge deployment)
- **Backend Hosting**: AWS EC2 / Railway / Heroku
- **Database**: AWS RDS / Supabase / managed PostgreSQL
- **Redis**: AWS ElastiCache / Upstash / Redis Cloud
- **Monitoring**: Sentry (error tracking), custom logging

### System Components in Detail

#### 1. Authentication System
- **JWT-based authentication** with access/refresh tokens
- **OAuth 2.0 integration** with Google and GitHub
- **Role-based access control** (RBAC): `user` and `admin` roles
- **Protected routes** with automatic token refresh
- **Session management** with secure token storage

#### 2. Dataset Management
- **Upload**: CSV file uploads with validation (max 100MB)
- **Profiling**: Automatic schema detection, data type inference
- **PII/PHI Detection**: Identifies sensitive columns
- **Statistics**: Distribution analysis, missing values, correlations
- **Storage**: Files stored in S3, metadata in PostgreSQL

#### 3. Synthetic Data Generation
- **Multiple Algorithms**:
  - CTGAN (Conditional Tabular GAN)
  - TVAE (Tabular Variational Autoencoder)
  - GaussianCopula (correlation-based)
- **Differential Privacy**: Optional ε-DP with configurable privacy budget
- **Async Processing**: Background jobs via Celery workers
- **Progress Tracking**: Real-time job status updates
- **Result Storage**: Generated datasets stored in S3

#### 4. Quality Evaluation
- **Statistical Tests**:
  - Column shapes (distribution similarity)
  - Column pair trends (correlations)
  - Kolmogorov-Smirnov tests
- **ML Utility Tests**:
  - Classification performance (real vs synthetic)
  - Predictive accuracy comparison
- **Privacy Metrics**:
  - Privacy loss (ε, δ)
  - Membership inference risk

#### 5. AI Assistant (LLM Integration)
- **Interactive Chat**: Guide users through workflows
- **Context-Aware**: Understands project and dataset context
- **Action Suggestions**: Recommends next steps
- **Code Generation**: Generates synthetic data scripts
- **Error Help**: Explains errors and suggests fixes

#### 6. Admin Features
- **Audit Logs**: Immutable activity tracking (who, what, when)
- **Compliance Reports**: HIPAA, GDPR, SOC-2 documentation
- **Billing Dashboard**: Usage metrics, cost tracking
- **Export Management**: Download datasets and reports
- **User Management**: View users, assign roles

#### 7. Job Processing System
- **Celery Workers**: Distributed task execution
- **Redis Queue**: Task broker and result backend
- **Job States**: pending → running → completed/failed
- **Retry Logic**: Automatic retries with exponential backoff
- **Result Storage**: Job results stored in Redis (temp) and PostgreSQL (permanent)

### Data Flow

#### Dataset Upload Flow
```
1. User uploads CSV → Frontend validates
2. File sent to Backend API → S3 storage
3. Background job created → Celery worker
4. Worker profiles data → Statistics computed
5. Results stored → PostgreSQL + Redis cache
6. Frontend polls → Updates UI
```

#### Synthetic Data Generation Flow
```
1. User configures generator → Frontend sends request
2. Backend creates job → Stores in PostgreSQL
3. Celery worker picks up → Loads dataset from S3
4. ML model trains → Generates synthetic data
5. Optional: Applies differential privacy
6. Synthetic data saved → S3 + metadata in DB
7. Evaluation runs → Quality metrics computed
8. Results returned → User downloads
```

#### Authentication Flow
```
1. User logs in → Credentials sent to backend
2. Backend validates → Generates JWT tokens
3. Tokens returned → Stored in frontend (localStorage)
4. Every API request → JWT in Authorization header
5. Backend verifies → Validates signature & expiry
6. Token expires → Refresh token used
7. Logout → Tokens removed from storage
```

### Database Schema Overview

#### Core Tables
- **users**: User accounts, roles, OAuth data
- **datasets**: Dataset metadata, S3 paths, schemas
- **projects**: Project organization, user ownership
- **generators**: Synthetic data generator configurations
- **jobs**: Background job tracking, status, results
- **evaluations**: Quality metrics, test results
- **audit_logs**: Immutable activity records
- **exports**: Export requests and file references

#### Relationships
- Users → Projects (1:many)
- Projects → Datasets (1:many)
- Datasets → Generators (1:many)
- Generators → Jobs (1:many)
- Jobs → Evaluations (1:1)

### Security Architecture

#### Authentication & Authorization
- JWT tokens with 1-hour expiry
- Refresh tokens for silent renewal
- Role-based access control (RBAC)
- OAuth 2.0 for social login
- CORS configured for allowed origins

#### Data Security
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- S3 bucket access via IAM roles
- API rate limiting (100 req/min per user)
- Input validation and sanitization

#### Privacy Protection
- Differential privacy for synthetic data
- PII/PHI detection and masking
- Audit logs for compliance
- Data retention policies
- GDPR-compliant data deletion

### Scalability & Performance

#### Frontend Optimization
- Next.js App Router with server components
- Code splitting and lazy loading
- Image optimization (next/image)
- Edge caching (Vercel CDN)
- <1s Time to Interactive (TTI)

#### Backend Optimization
- Async endpoints (FastAPI async)
- Database connection pooling
- Redis caching for frequent queries
- Celery workers for CPU-intensive tasks
- Horizontal scaling capability

#### Database Optimization
- Indexed foreign keys
- Partial indexes for common queries
- Materialized views for dashboards
- Query optimization with EXPLAIN ANALYZE
- Read replicas for analytics

### Monitoring & Observability

#### Logging
- Structured logging (JSON format)
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Log aggregation (CloudWatch, Papertrail)
- Request/response logging with timing

#### Error Tracking
- Sentry integration for error reporting
- Source maps for frontend debugging
- Stack traces with context
- User session replay (optional)

#### Metrics
- API response times
- Job processing duration
- Database query performance
- Cache hit rates
- Active user sessions

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.9+ and pip
- Node.js 18+ and pnpm
- Git

### 1. Clone Repository

```bash
git clone https://github.com/Urz1/synthetic-data-studio.git
cd synthetic-data-studio
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000
API docs at http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your settings

# Start frontend
pnpm dev
```

Frontend runs at http://localhost:3000

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Admin Dashboard**: http://localhost:3000/dashboard (requires admin role)

## 📚 Documentation

### Core Documentation

- **[Backend README](backend/README.md)** - Backend API, architecture, and deployment
- **[Frontend README](frontend/README.md)** - Frontend setup, structure, and deployment
- **[Deployment Guide](DEPLOYMENT.md)** - Complete production deployment guide
- **[Pre-Deployment Checklist](PRE_DEPLOYMENT_CHECKLIST.md)** - 200+ item production checklist
- **[Quick Reference](QUICK_REFERENCE.md)** - Common commands and operations
- **[Project Summary](PROJECT_SUMMARY.md)** - Comprehensive project overview
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- **[Contact Guide](CONTACT.md)** - Get in touch, report issues, collaborate
- **[Changelog](CHANGELOG.md)** - Version history and updates

### Backend Docs

- **[API Specification](backend/API_SPECIFICATION.md)** - Complete API reference
- **[Developer Guide](backend/docs/developer-guide/)** - Architecture and development
- **[User Guide](backend/docs/user-guide/)** - Platform usage and features
- **[Tutorials](backend/docs/tutorials/)** - Step-by-step guides
- **[API Examples](backend/docs/examples/)** - Code samples and Postman collection

### Additional Resources

- **[Architecture Overview](docs/architecture.md)** - System design and components
- **[API Spec (OpenAPI)](docs/api_spec.yaml)** - OpenAPI 3.0 specification
- **[Compliance Pack](docs/compliance_pack_outline.md)** - Compliance reporting structure
- **[Roadmap](docs/roadmap.md)** - Feature roadmap and milestones

## 📊 Features & Capabilities

### Core Features

#### 1. Dataset Management
- **Upload & Import**
  - CSV file support (up to 100MB)
  - Automatic schema detection
  - Data type inference (numeric, categorical, datetime)
  - Column metadata extraction
  
- **Data Profiling**
  - Statistical summaries (mean, median, std, quartiles)
  - Distribution analysis with histograms
  - Missing value detection and percentage
  - Outlier identification
  - Correlation matrices
  - PII/PHI column detection
  
- **Data Validation**
  - Schema validation
  - Format checks
  - Duplicate detection
  - Data quality scoring

#### 2. Synthetic Data Generation
- **Algorithms Supported**
  - **CTGAN**: Best for mixed data types (numeric + categorical)
  - **TVAE**: Good for high-cardinality categorical data
  - **GaussianCopula**: Fast, works well for continuous data
  
- **Configuration Options**
  - Number of rows to generate (1 - 1,000,000)
  - Training epochs (100 - 1000)
  - Batch size (64 - 512)
  - Conditional generation (generate based on specific column values)
  
- **Differential Privacy**
  - Enable/disable DP protection
  - Configure privacy budget (ε: 0.1 - 10.0)
  - Set delta parameter (typically 1e-5)
  - Privacy accounting with RDP
  - Trade-off: Privacy vs Utility

- **Generation Process**
  - Background processing (non-blocking)
  - Real-time progress tracking
  - Estimated completion time
  - Automatic retry on failure
  - Email notification on completion (optional)

#### 3. Quality Evaluation
- **Statistical Similarity**
  - **Column Shapes Score**: How well distributions match (0-1)
  - **Column Pair Trends Score**: Correlation preservation (0-1)
  - **Overall Quality Score**: Weighted average
  - Kolmogorov-Smirnov test for each column
  - Chi-square test for categorical columns
  
- **ML Utility Tests**
  - Train classifier on real data
  - Test on synthetic data
  - Compare accuracy, F1, precision, recall
  - Feature importance comparison
  - Predictive parity assessment
  
- **Privacy Tests**
  - Membership inference attacks
  - Attribute disclosure risk
  - Re-identification risk assessment
  - k-anonymity checks

- **Visual Comparisons**
  - Side-by-side distribution plots
  - Correlation heatmaps (real vs synthetic)
  - Scatter plots for key relationships
  - Box plots for outlier detection

#### 4. AI-Powered Assistant
- **Capabilities**
  - Natural language queries about your data
  - Generate synthetic data with conversational prompts
  - Explain evaluation results
  - Recommend best generator for your dataset
  - Debug errors and issues
  - Generate code snippets for API usage
  
- **Context Awareness**
  - Understands your current project
  - Remembers conversation history
  - Accesses dataset metadata
  - Provides personalized recommendations

- **LLM Integration**
  - Powered by OpenAI GPT-4 or Anthropic Claude
  - Configurable model selection
  - Streaming responses for better UX
  - Token usage tracking

#### 5. Project Organization
- **Projects**
  - Group related datasets and generators
  - Team collaboration (share with other users)
  - Project-level settings and configs
  - Tagging and categorization
  
- **Workspace Management**
  - Personal workspace per user
  - Shared workspaces for teams
  - Access control per workspace
  - Activity feed per project

#### 6. Job Monitoring
- **Real-Time Tracking**
  - Job status: Pending, Running, Completed, Failed
  - Progress percentage
  - Elapsed time and ETA
  - Resource usage (CPU, memory)
  
- **Job History**
  - View all past jobs
  - Filter by status, date, project
  - Re-run failed jobs
  - Download job logs
  
- **Notifications**
  - In-app notifications
  - Email alerts (optional)
  - Webhook integration for CI/CD

#### 7. Exports & Downloads
- **Export Formats**
  - CSV (with metadata)
  - JSON (with schema)
  - Parquet (for big data)
  - SQL dump (for databases)
  
- **Bulk Export**
  - Export multiple datasets at once
  - Zip archive creation
  - Direct S3 download links
  - Expiring download URLs (24 hours)

#### 8. User Settings
- **Profile Management**
  - Update name, email
  - Change password
  - Upload profile picture
  - Set timezone preferences
  
- **Notification Preferences**
  - Email notifications on/off
  - Job completion alerts
  - Weekly summary reports
  
- **API Keys**
  - Generate personal API keys
  - Revoke/regenerate keys
  - Usage tracking per key

### Admin-Only Features

#### 1. Audit Logs
- **Comprehensive Tracking**
  - User login/logout events
  - Dataset uploads and deletions
  - Generator creation and execution
  - Configuration changes
  - API access logs
  
- **Log Details**
  - Timestamp (precise to millisecond)
  - User ID and username
  - Action performed
  - Resource affected
  - IP address and user agent
  - Request/response payloads (sanitized)
  
- **Search & Filter**
  - Filter by date range
  - Search by user, action, resource
  - Export audit logs (CSV, JSON)
  - Immutable records (tamper-proof)

#### 2. Compliance Reporting
- **HIPAA Compliance**
  - Access logs for PHI
  - Encryption at rest/transit verification
  - Business Associate Agreement (BAA) templates
  - Risk assessment reports
  
- **GDPR Compliance**
  - Data processing records
  - Right to erasure implementation
  - Data portability exports
  - Consent management logs
  
- **SOC 2 Compliance**
  - Security controls documentation
  - System availability metrics
  - Incident response logs
  - Change management records
  
- **Custom Reports**
  - Generate compliance reports on-demand
  - Schedule recurring reports (monthly/quarterly)
  - Export to PDF with digital signatures
  - Share with auditors securely

#### 3. Billing Management
- **Usage Tracking**
  - Datasets uploaded (count, size)
  - Synthetic data generated (rows, volume)
  - API calls (count, rate)
  - Storage used (GB-months)
  - Compute hours (worker time)
  
- **Cost Analytics**
  - Cost per user
  - Cost per project
  - Monthly spending trends
  - Cost forecasting
  
- **Billing Integration**
  - Stripe integration for payments
  - Usage-based pricing tiers
  - Invoice generation
  - Payment history

#### 4. Export Management
- **Admin Export Controls**
  - View all user exports
  - Approve/deny export requests
  - Set export quotas per user
  - Monitor export bandwidth
  
- **Data Loss Prevention**
  - Watermarking synthetic datasets
  - Export audit trails
  - Detect unauthorized sharing
  - Revoke export access

#### 5. User Management
- **User Administration**
  - View all users and their roles
  - Activate/deactivate accounts
  - Reset user passwords
  - Assign admin privileges
  - View user activity logs
  
- **Role Management**
  - Create custom roles
  - Define permissions per role
  - Role-based resource access
  - Bulk role assignment

#### 6. System Monitoring
- **Health Checks**
  - API endpoint health
  - Database connection status
  - Redis connectivity
  - S3 bucket access
  - Celery worker status
  
- **Performance Metrics**
  - API response times
  - Database query performance
  - Job processing times
  - Error rates
  
- **Alerts & Notifications**
  - System downtime alerts
  - Performance degradation warnings
  - Storage capacity alerts
  - Security incident notifications

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests (if configured)
cd frontend
pnpm test

# Integration tests
pytest tests/integration/ -v
```

## 🤝 Contributing

Contributions are welcome! Please refer to [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [`LICENSE`](LICENSE) file for details.

## 👤 Developer Contact

**Sadam Husen**
- 📧 **Email**: halisadam391@gmail.com
- 💼 **LinkedIn**: [linkedin.com/in/sadam-husen-16s](https://www.linkedin.com/in/sadam-husen-16s/)
- 🐙 **GitHub**: [github.com/Urz1](https://github.com/Urz1)

For questions, feedback, or collaboration opportunities, please reach out via email or open an issue on GitHub.
