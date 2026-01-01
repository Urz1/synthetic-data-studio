# Synth Studio 🧪

> Privacy-first synthetic data generation for healthcare and fintech

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/github/actions/workflow/status/Urz1/synthetic-data-studio/ci.yml?branch=main)](https://github.com/Urz1/synthetic-data-studio/actions)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-3776AB.svg)](backend/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](frontend/)
[![Docs](https://img.shields.io/badge/Docs-Online-green)](https://docs.synthdata.studio)

---

## ⚡ Quick Install

```bash
# Clone
git clone https://github.com/Urz1/synthetic-data-studio.git && cd synthetic-data-studio

# Backend
cd backend && cp .env.example .env
pip install -r requirements.txt && alembic upgrade head
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend && cp .env.local.example .env.local
pnpm install && pnpm dev
```

**Frontend:** http://localhost:3000 | **API Docs:** http://localhost:8000/docs

📖 Full setup guide: [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)

---

## 🎯 What It Does

Generate high-quality synthetic data with **differential privacy** guarantees. Built for regulated industries:

| Industry                | Use Case                             |
| ----------------------- | ------------------------------------ |
| 🏥 Healthcare (HIPAA)   | Synthetic EHR, FHIR, patient records |
| 🏦 Fintech (SOC-2/GDPR) | Transaction data, fraud testing      |
| 🤖 ML Teams             | Privacy-safe training datasets       |
| 🏢 Enterprise           | Cross-department data sharing        |

---

## ✨ Key Features

### Generation Methods

| Method               | Description                                               | Best For                |
| -------------------- | --------------------------------------------------------- | ----------------------- |
| **Schema-Based**     | Define columns → generate data (no source dataset needed) | Testing, prototyping    |
| **Dataset-Based ML** | Train on real data → generate synthetic                   | Production quality      |
| **LLM-Powered Seed** | AI generates realistic seed data → statistical expansion  | Domain-specific realism |

### ML Generators

- **CTGAN** - Conditional Tabular GAN (mixed numeric + categorical)
- **TVAE** - Tabular Variational Autoencoder (high-cardinality categorical)
- **GaussianCopula** - Statistical copulas (fast, correlation-preserving)

### Privacy & Compliance

- **Differential Privacy** - Configurable ε/δ with RDP accounting
- **PII/PHI Detection** - Automatic sensitive column identification
- **Compliance Reports** - HIPAA, GDPR, SOC-2 ready documentation
- **Audit Logs** - Immutable activity tracking

### AI-Powered Features

- **Chat Assistant** - Natural language data generation guidance
- **Enhanced PII Detection** - LLM-powered sensitivity analysis
- **Compliance Writer** - Auto-generate compliance documentation
- **Report Translation** - Multi-language report generation

### Quality Evaluation

- **Statistical Similarity** - Distribution matching, K-S tests
- **ML Utility** - Train/test accuracy preservation
- **Privacy Risk** - Membership inference, re-identification risk

---

## 📋 Prerequisites

| Requirement | Version                            |
| ----------- | ---------------------------------- |
| Python      | 3.9+                               |
| Node.js     | 18+                                |
| PostgreSQL  | 13+                                |
| Redis       | 7+ (optional, for background jobs) |

**Environment Variables:**

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost/synthstudio
SECRET_KEY=your-jwt-secret
AWS_S3_BUCKET=your-bucket  # optional

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-auth-secret
```

---

## 🔧 Usage

### Generate from Schema (No Dataset Needed)

```bash
curl -X POST "http://localhost:8000/generators/schema" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "columns": {
      "name": {"type": "string", "faker": "name"},
      "age": {"type": "integer", "min": 18, "max": 80},
      "email": {"type": "string", "faker": "email"},
      "balance": {"type": "number", "min": 0, "max": 50000}
    }
  }'
```

### Generate from Dataset (ML-Based)

```bash
# Upload dataset
curl -X POST "http://localhost:8000/datasets/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@data.csv"

# Generate synthetic data with DP
curl -X POST "http://localhost:8000/generators/dataset/{dataset_id}/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "generator_type": "ctgan",
    "num_rows": 10000,
    "epochs": 300,
    "differential_privacy": {"enabled": true, "epsilon": 1.0, "delta": 1e-5}
  }'
```

### Python SDK Example

```python
import requests

# Login
session = requests.Session()
session.post("http://localhost:8000/auth/login", json={
    "email": "user@example.com", "password": "secret"
})

# Schema-based generation
synth_data = session.post("/generators/schema?num_rows=1000", json={
    "columns": {
        "patient_id": {"type": "string", "pattern": "PAT-[0-9]{6}"},
        "diagnosis": {"type": "category", "values": ["A01", "B12", "C34"]},
        "visit_date": {"type": "date", "min": "2024-01-01", "max": "2024-12-31"}
    }
}).json()
```

---

## 🧪 Testing

```bash
# Backend tests with coverage
cd backend && pytest tests/ -v --cov=app

# Frontend tests
cd frontend && pnpm test

# E2E tests
cd frontend && pnpm test:e2e
```

---

## 📁 Project Structure

```
synth-studio/
├── backend/                  # FastAPI API server
│   ├── app/
│   │   ├── auth/            # Authentication (JWT, OAuth, 2FA)
│   │   ├── datasets/        # Dataset upload, profiling
│   │   ├── generators/      # Schema + ML generation
│   │   ├── evaluations/     # Quality metrics
│   │   ├── services/
│   │   │   ├── synthesis/   # CTGAN, TVAE, Copula
│   │   │   ├── llm/         # AI chat, PII detection
│   │   │   └── privacy/     # DP accounting
│   │   ├── compliance/      # HIPAA/GDPR reports
│   │   └── audit/           # Activity logging
│   └── tests/
├── frontend/                 # Next.js 16 web app
│   ├── app/
│   │   ├── dashboard/       # Overview & metrics
│   │   ├── datasets/        # Upload & profile
│   │   ├── generators/      # Create & manage
│   │   ├── evaluations/     # Quality reports
│   │   ├── synthetic-datasets/  # Generated data
│   │   ├── compliance/      # Compliance center
│   │   └── assistant/       # AI chat
│   └── components/
└── docs/                     # Docusaurus docs
```

---

## 📚 Documentation

| Resource                                       | Description               |
| ---------------------------------------------- | ------------------------- |
| [**Docs Site**](https://docs.synthdata.studio) | Full documentation        |
| [Getting Started](docs/docs/getting-started/)  | Installation & quickstart |
| [User Guide](docs/docs/user-guide/)            | Feature walkthroughs      |
| [API Reference](http://localhost:8000/docs)    | OpenAPI/Swagger           |
| [Examples](docs/docs/examples/)                | Code samples & Postman    |

---

## 🤝 Contributing

1. Fork & clone
2. Create feature branch (`git checkout -b feature/amazing`)
3. Add tests & make changes
4. Run tests (`pytest` / `pnpm test`)
5. Submit PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 🔒 Security

Report vulnerabilities privately: [halisadam391@gmail.com](mailto:halisadam391@gmail.com) or see [SECURITY.md](SECURITY.md).

---

## 📄 License

[MIT](LICENSE) © 2025 Sadam Husen

---

## 📬 Contact

**Sadam Husen** — [@Urz1](https://github.com/Urz1) — [halisadam391@gmail.com](mailto:halisadam391@gmail.com)

[LinkedIn](https://www.linkedin.com/in/sadam-husen-16s/) • [GitHub](https://github.com/Urz1)

---

<details>
<summary><strong>🏗️ Architecture</strong></summary>

```
┌─────────────────────────────────────────────────────┐
│               Frontend (Next.js 16)                 │
│  Dashboard • Datasets • Generators • Evaluations   │
│  Compliance • Audit • Billing • AI Assistant       │
└────────────────────────┬────────────────────────────┘
                         │ REST API (JWT + OAuth)
┌────────────────────────▼────────────────────────────┐
│                Backend (FastAPI)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │   Auth   │ │ Datasets │ │Generators│            │
│  │JWT/OAuth │ │Profiling │ │Schema/ML │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │   LLM    │ │Evaluation│ │Compliance│            │
│  │Chat/PII  │ │Quality   │ │Reports   │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└───────┬───────────────┬────────────────┬────────────┘
        ▼               ▼                ▼
   PostgreSQL        Redis          AWS S3
   (metadata)     (queue/cache)    (files)
                        │
                        ▼
              Celery Workers
        (generation, evaluation, exports)
```

**Tech Stack:**

- **Frontend:** Next.js 16, React 19, TypeScript 5, Tailwind, shadcn/ui
- **Backend:** FastAPI, SQLAlchemy 2, Celery, SDV
- **ML/Privacy:** CTGAN, TVAE, Opacus (DP), RDP accounting
- **LLM:** OpenAI/Anthropic (chat, PII detection, compliance)
- **Infra:** Vercel, Railway/AWS, Neon/Supabase

</details>

<details>
<summary><strong>📊 Complete Feature List</strong></summary>

### Data Generation

- Schema-based generation (no training data required)
- Dataset-based ML generation (CTGAN, TVAE, GaussianCopula)
- LLM-powered seed data generation
- Differential privacy with configurable ε/δ
- DP parameter validation & recommendations
- Model download & export

### Data Management

- CSV upload with auto-profiling
- Schema detection & type inference
- PII/PHI column detection
- Distribution analysis & statistics
- Correlation matrices
- Missing value analysis

### Quality & Privacy

- Statistical similarity scoring
- ML utility evaluation (classification/regression)
- Privacy risk assessment
- Membership inference testing
- k-anonymity checks
- Privacy budget tracking

### AI Assistant

- Natural language queries
- Context-aware recommendations
- Code generation for API usage
- Error debugging
- Compliance guidance

### Enterprise

- HIPAA/GDPR/SOC-2 compliance reports
- Immutable audit logs
- Usage & billing dashboards
- Role-based access control
- OAuth (Google, GitHub)
- Two-factor authentication

</details>

<details>
<summary><strong>🗺️ Roadmap</strong></summary>

- [ ] FHIR/HL7 medical data formats
- [ ] Time-series synthetic data
- [ ] Enterprise SSO (SAML 2.0)
- [ ] Python & JavaScript SDKs
- [ ] Self-hosted Docker templates
- [ ] Real-time streaming generation

See [CHANGELOG.md](CHANGELOG.md) for version history.

</details>
