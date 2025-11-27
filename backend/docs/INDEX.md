# 📚 Synthetic Data Studio Documentation

Welcome to the comprehensive documentation for Synthetic Data Studio, a production-ready platform for generating high-quality synthetic data with differential privacy guarantees.

## 🚀 Quick Navigation

### 🆕 Just Getting Started?
- **[Installation Guide](getting-started/installation.md)** - Complete setup instructions
- **[Quick Start Tutorial](getting-started/quick-start.md)** - Generate your first synthetic dataset
- **[Configuration](getting-started/configuration.md)** - Environment setup and options

### 👥 I'm a User
- **[Platform Overview](user-guide/overview.md)** - Understanding Synthetic Data Studio
- **[Data Management](user-guide/uploading-data.md)** - Upload and manage datasets
- **[Data Synthesis](user-guide/generating-data.md)** - Generate synthetic data
- **[Privacy Features](user-guide/privacy-features.md)** - Differential privacy and compliance
- **[Quality Evaluation](user-guide/evaluating-quality.md)** - Assess synthetic data quality
- **[AI Features](user-guide/ai-features.md)** - Interactive chat and automation

### 🔌 I'm a Developer
- **[API Examples](examples/)** - Code examples and API usage
- **[Architecture](developer-guide/architecture.md)** - System design and components
- **[Development Setup](developer-guide/development-setup.md)** - Dev environment
- **[Testing](developer-guide/testing.md)** - Testing guidelines and procedures
- **[Deployment](developer-guide/deployment.md)** - Production deployment

### 🎓 I Want to Learn
- **[Basic Synthesis Tutorial](tutorials/basic-synthesis.md)** - End-to-end data generation
- **[Privacy Synthesis Tutorial](tutorials/privacy-synthesis.md)** - DP workflow tutorial
- **[Quality Assessment Tutorial](tutorials/quality-evaluation.md)** - Evaluation tutorial
- **[Compliance Reporting Tutorial](tutorials/compliance-reporting.md)** - Audit preparation

## 📋 Documentation Structure

```
docs/
├── index.md                    # This navigation hub
├── getting-started/           # First-time setup and basics
├── user-guide/                # Feature guides and workflows
├── tutorials/                 # Step-by-step tutorials
├── developer-guide/           # Development and deployment
├── examples/                  # Code examples and API usage
└── reference/                 # Configuration and troubleshooting
```

## 🎯 Key Features Overview

### 🔒 Differential Privacy
- **Mathematical Guarantees**: (ε, δ)-differential privacy with RDP accounting
- **Safety Validation**: 3-layer validation prevents privacy failures
- **Compliance Ready**: HIPAA, GDPR, CCPA, SOC-2 reporting
- **Multiple Algorithms**: DP-CTGAN, DP-TVAE with automatic parameter tuning

### 🤖 AI-Powered Capabilities
- **Interactive Chat**: Ask questions about your synthetic data quality
- **Smart Suggestions**: AI-powered recommendations for improvement
- **Auto-Documentation**: Generate model cards and audit narratives
- **Enhanced Detection**: Context-aware PII identification

### 📊 Quality Assurance
- **Statistical Similarity**: KS tests, Chi-square, Wasserstein distance
- **ML Utility**: Classification/regression performance evaluation
- **Privacy Leakage**: Membership and attribute inference detection
- **Comprehensive Reports**: Actionable quality assessments

### 🔧 Enterprise-Ready
- **Multiple Synthesis Methods**: CTGAN, TVAE, GaussianCopula
- **Background Processing**: Asynchronous job handling
- **Scalable Architecture**: FastAPI with SQLAlchemy
- **Production Deployment**: Docker, cloud-native ready

## 🌟 Common Workflows

### 1. Basic Data Synthesis
1. [Upload Dataset](user-guide/uploading-data.md)
2. [Generate Profile](user-guide/uploading-data.md#data-profiling)
3. [Create Synthetic Data](user-guide/generating-data.md)
4. [Evaluate Quality](user-guide/evaluating-quality.md)

### 2. Privacy-Preserving Synthesis
1. [Validate DP Configuration](user-guide/privacy-features.md#configuration-validation)
2. [Generate with Privacy Guarantees](user-guide/generating-data.md#differential-privacy)
3. [Review Privacy Report](user-guide/privacy-features.md#privacy-reports)
4. [Compliance Documentation](user-guide/privacy-features.md#compliance-reporting)

### 3. Quality Assessment
1. [Run Comprehensive Evaluation](user-guide/evaluating-quality.md#comprehensive-evaluation)
2. [Review Statistical Metrics](user-guide/evaluating-quality.md#statistical-similarity)
3. [Check ML Utility](user-guide/evaluating-quality.md#ml-utility)
4. [AI-Powered Insights](user-guide/ai-features.md#evaluation-chat)

## 🔍 Search & Discovery

### By Use Case
- **Healthcare**: [PHI Detection](user-guide/uploading-data.md#sensitive-data-detection), [HIPAA Compliance](user-guide/privacy-features.md#hipaa-compliance)
- **Finance**: [Transaction Synthesis](tutorials/privacy-synthesis.md), [Fraud Detection](user-guide/generating-data.md#conditional-sampling)
- **Analytics**: [Quality Evaluation](user-guide/evaluating-quality.md), [ML Utility Testing](user-guide/evaluating-quality.md#ml-utility)

### By Technical Focus
- **Privacy**: [DP Configuration](user-guide/privacy-features.md), [Privacy Reports](examples/postman-collection.json)
- **Quality**: [Evaluation API](examples/python-client.md), [Statistical Tests](user-guide/evaluating-quality.md#statistical-tests)
- **AI Features**: [Chat Interface](examples/curl-examples.md), [Smart Suggestions](user-guide/ai-features.md#suggestions)

## 📖 Reading Paths

### Beginner Path
1. [Installation](getting-started/installation.md)
2. [Quick Start](getting-started/quick-start.md)
3. [Basic Synthesis Tutorial](tutorials/basic-synthesis.md)
4. [Platform Overview](user-guide/overview.md)

### Privacy Engineer Path
1. [Privacy Features Overview](user-guide/privacy-features.md)
2. [DP Configuration Guide](user-guide/privacy-features.md#configuration-validation)
3. [Privacy Synthesis Tutorial](tutorials/privacy-synthesis.md)
4. [Compliance Reporting](tutorials/compliance-reporting.md)

### Developer Path
1. [Development Setup](developer-guide/development-setup.md)
2. [Architecture Overview](developer-guide/architecture.md)
3. [API Examples](examples/)
4. [Testing Guide](developer-guide/testing.md)

## 🔗 External Resources

- **Live API**: http://localhost:8000/docs (when running)
- **GitHub Repository**: https://github.com/Urz1/synthetic-data-studio
- **Differential Privacy**: https://privacytools.seas.harvard.edu/differential-privacy
- **SDV Documentation**: https://docs.sdv.dev/

## 📞 Support

- **📖 Documentation Issues**: [GitHub Issues](https://github.com/Urz1/synthetic-data-studio/issues)
- **💬 General Discussion**: [GitHub Discussions](https://github.com/Urz1/synthetic-data-studio/discussions)
- **📧 Security Issues**: security@synthetic-data-studio.com

## 📝 Contributing

Help improve our documentation! See our [Contributing Guide](../CONTRIBUTING.md) for guidelines on:
- Writing documentation
- Reporting issues
- Suggesting improvements
- Code contributions

---

**Ready to explore?** Start with our [Quick Start Tutorial](getting-started/quick-start.md) to generate your first synthetic dataset! 🚀
