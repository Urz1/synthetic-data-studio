# Synthetic Data Studio — Backend

A production-ready synthetic data generation platform with differential privacy guarantees, built with FastAPI and SDV.

## 🎯 Features

### Core Capabilities

- **Data Profiling**: Statistical analysis, outlier detection, correlation matrices
- **PII/PHI Detection**: Automated sensitive data identification with recommendations
- **Multiple Synthesis Methods**:
  - CTGAN (Conditional Tabular GAN)
  - TVAE (Tabular Variational Autoencoder)
  - GaussianCopula (schema-based generation)
  - DP-CTGAN (Differential Privacy)
  - DP-TVAE (Differential Privacy, faster)
- **Privacy Guarantees**: (ε, δ)-differential privacy with RDP accounting
- **Compliance**: HIPAA, GDPR, CCPA, SOC-2 compliance reporting
- **Safety System**: 3-layer validation to prevent privacy failures

### 🤖 AI-Powered Features (NEW)

- **Interactive Chat**: Ask questions about your synthetic data quality
- **Smart Suggestions**: AI-powered recommendations to improve data quality
- **Metric Explanations**: Plain English explanations of technical metrics
- **Auto-Documentation**: Generate model cards and audit narratives
- **Compliance Mapping**: Automated GDPR/HIPAA/CCPA/SOC2 compliance reports
- **Enhanced PII Detection**: Context-aware identification of sensitive data

> **See [LLM_IMPLEMENTATION_PLAN.md](LLM_IMPLEMENTATION_PLAN.md) for complete AI features documentation**

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/Urz1/synthetic-data-studio.git
cd synthetic-data-studio/backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
python -m app.database.create_tables
```

### Run Server

```bash
# Development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the batch file (Windows)
start_server.bat
```

### Access API

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 📚 Documentation

### Complete Documentation Index

See [docs/INDEX.md](docs/INDEX.md) for full documentation structure

### Quick Links

- **Getting Started**: [docs/guides/TESTING.md](docs/guides/TESTING.md)
- **DP Quick Reference**: [docs/phase3/PHASE3_SAFETY_QUICKREF.md](docs/phase3/PHASE3_SAFETY_QUICKREF.md)
- **API Examples**: [docs/phase3/PHASE3_SAFETY_API_EXAMPLES.md](docs/phase3/PHASE3_SAFETY_API_EXAMPLES.md)
- **Implementation Plan**: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)

### Phase Documentation

- [Phase 1: Data Profiling](docs/phase1/PHASE1_SUMMARY.md)
- [Phase 2: Synthesis Models](docs/phase2/PHASE2_SUMMARY.md)
- [Phase 3: Differential Privacy](docs/phase3/PHASE3_SUMMARY.md)

## 🏗️ Architecture

```
app/
├── core/           # Configuration, dependencies, utilities
├── auth/           # Authentication & authorization
├── datasets/       # Dataset management & profiling
├── generators/     # Synthesis model orchestration
├── services/       # Business logic
│   ├── synthesis/  # DP-CTGAN, DP-TVAE, CTGAN, TVAE
│   └── privacy/    # Privacy validation & reporting
├── database/       # Database models & migrations
├── storage/        # S3 integration
└── api/            # API routes
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run specific test suite
pytest tests/test_datasets.py

# Run with coverage
pytest --cov=app
```

## 🔒 Differential Privacy Usage

### Validate Configuration First

```bash
curl -X POST http://localhost:8000/generators/dp/validate-config \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "your-dataset-id",
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
  }'
```

### Generate with DP

```bash
curl -X POST http://localhost:8000/generators/dataset/{id}/generate \
  -H "Content-Type: application/json" \
  -d '{
    "generator_type": "dp-ctgan",
    "epochs": 20,
    "batch_size": 100,
    "target_epsilon": 10.0
  }'
```

### Get Privacy Report

```bash
curl http://localhost:8000/generators/{generator_id}/privacy-report
```

## 📊 API Endpoints

### Datasets

- `POST /datasets/upload` - Upload dataset
- `GET /datasets/` - List datasets
- `POST /datasets/{id}/profile` - Generate profile
- `POST /datasets/{id}/detect-pii` - Detect sensitive data

### Generators

- `POST /generators/dataset/{id}/generate` - Generate synthetic data
- `GET /generators/{id}` - Get generator details
- `GET /generators/{id}/privacy-report` - Get privacy report

### Differential Privacy

- `POST /generators/dp/validate-config` - Validate DP config
- `GET /generators/dp/recommended-config` - Get safe parameters

## 🛡️ Safety Features

The system includes 3-layer privacy protection:

1. **Pre-Training Validation**: Catches bad configurations before training
2. **Improved Noise Calculation**: Proper RDP formula for accurate privacy accounting
3. **Post-Training Verification**: Validates actual privacy spent vs target

See [docs/phase3/PHASE3_SAFETY_SUMMARY.md](docs/phase3/PHASE3_SAFETY_SUMMARY.md) for details.

## 🌟 Privacy Levels

| Epsilon | Level       | Use Case                      |
| ------- | ----------- | ----------------------------- |
| <1.0    | Very Strong | Clinical trials, genomic data |
| 1-5     | Strong      | Healthcare, financial records |
| 5-10    | Moderate    | Customer data, HR records     |
| 10-20   | Weak        | Aggregated analytics          |
| >20     | Minimal     | Non-sensitive data            |

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL=sqlite:///./synth_studio.db

# Storage
UPLOAD_DIR=./uploads
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 📦 Dependencies

Core packages:

- `fastapi` - Web framework
- `sqlmodel` - ORM
- `sdv>=1.29.0` - Synthetic data generation
- `opacus>=1.4.0` - Differential privacy
- `pandas` - Data manipulation
- `numpy` - Numerical computing

See [requirements.txt](requirements.txt) for complete list.

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t synth-studio-backend .

# Run container
docker run -p 8000:8000 synth-studio-backend
```

### Production Considerations

- Use PostgreSQL instead of SQLite
- Enable HTTPS/TLS
- Set up Celery for background jobs
- Configure proper logging
- Implement rate limiting
- Use environment-specific configs

## 🤝 Contributing

1. Follow existing code structure
2. Write tests for new features
3. Update documentation
4. Ensure privacy validation for DP features
5. Run tests before committing

## 📝 License

[Add your license information]

## 📞 Support

- Documentation: [docs/INDEX.md](docs/INDEX.md)
- API Docs: http://localhost:8000/docs
- Issues: [GitHub Issues](https://github.com/Urz1/synthetic-data-studio/issues)

## 🎓 Resources

- [Differential Privacy Primer](https://privacytools.seas.harvard.edu/differential-privacy)
- [SDV Documentation](https://docs.sdv.dev/)
- [Opacus Documentation](https://opacus.ai/)

---

**Status**: Phase 3 Complete ✅ (Differential Privacy with Safety System)

**Next**: Phase 4 - Evaluation Suite (Statistical similarity, utility tests, privacy leakage)
