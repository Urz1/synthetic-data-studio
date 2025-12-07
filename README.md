# Synth Studio 🧪🔒

**Privacy-first synthetic data generation platform for healthcare and fintech startups**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)](backend/)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2016-000000)](frontend/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB)](backend/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)](frontend/)

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
## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Next.js 16    │ ───> │  FastAPI Backend │ ───> │   PostgreSQL    │
│   Frontend      │      │   + Celery       │      │   Database      │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Redis + S3      │
                         │  Cache/Queue     │
                         └──────────────────┘
```

**Tech Stack:**
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy, Celery, Python 3.9+
- **ML/Privacy**: SDV, Opacus, CTGAN, TVAE, Differential Privacy
- **Database**: PostgreSQL, Redis
- **Storage**: AWS S3 (file uploads)
- **Auth**: JWT + OAuth (Google, GitHub)

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

## 📊 Features

### For Regular Users

- **Dataset Management**: Upload, profile, and manage datasets
- **Synthetic Data Generation**: CTGAN, TVAE, GaussianCopula with DP options
- **Quality Evaluation**: Statistical similarity and ML utility tests
- **Project Organization**: Group datasets and generators into projects
- **Job Monitoring**: Track background generation jobs
- **AI Assistant**: Interactive chat for guidance and automation
- **Settings**: Profile management and preferences

### For Administrators

- **Audit Logs**: Complete activity tracking and security monitoring
- **Compliance Reports**: HIPAA, GDPR, SOC-2 compliance documentation
- **Billing Management**: Usage tracking and cost monitoring
- **Export Management**: Download reports and synthetic datasets
- **User Management**: Role-based access control

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
