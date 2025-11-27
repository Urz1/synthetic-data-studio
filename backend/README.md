# Synthetic Data Studio

A production-ready synthetic data generation platform with differential privacy guarantees, built with FastAPI and SDV.

## 🎯 Overview

Synthetic Data Studio enables organizations to generate high-quality synthetic datasets that maintain statistical properties and privacy guarantees. Perfect for healthcare, finance, and any industry requiring safe data for development, testing, and analytics.

### ✨ Key Features

- **🔒 Differential Privacy**: Mathematical privacy guarantees with RDP accounting
- **🤖 AI-Powered**: Interactive chat, smart suggestions, and automated documentation
- **📊 Quality Assurance**: Comprehensive evaluation suite with statistical and ML utility tests
- **🛡️ Compliance Ready**: HIPAA, GDPR, CCPA, SOC-2 compliance reporting
- **🔬 Multiple Methods**: CTGAN, TVAE, GaussianCopula, and privacy-preserving variants

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/Urz1/synthetic-data-studio.git
cd synthetic-data-studio/backend

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Visit API docs
open http://localhost:8000/docs
```

## 📚 Documentation

### 📖 Getting Started
- **[Installation Guide](docs/getting-started/installation.md)** - Complete setup instructions
- **[Quick Start Tutorial](docs/getting-started/quick-start.md)** - 5-minute hands-on tutorial
- **[Configuration](docs/getting-started/configuration.md)** - Environment setup and options

### 👥 User Guides
- **[Platform Overview](docs/user-guide/overview.md)** - Understanding Synthetic Data Studio
- **[Data Management](docs/user-guide/uploading-data.md)** - Upload and manage datasets
- **[Data Synthesis](docs/user-guide/generating-data.md)** - Generate synthetic data
- **[Privacy Features](docs/user-guide/privacy-features.md)** - Differential privacy and compliance
- **[Quality Evaluation](docs/user-guide/evaluating-quality.md)** - Assess synthetic data quality
- **[AI Features](docs/user-guide/ai-features.md)** - Interactive chat and automation

### 🔌 API Examples
- **[Postman Collection](docs/examples/postman-collection.json)** - Complete API collection
- **[Python Client](docs/examples/python-client.md)** - Python SDK examples
- **[cURL Examples](docs/examples/curl-examples.md)** - Command-line API usage
- **[Live API Docs](http://localhost:8000/docs)** - Interactive API documentation

### 🎓 Tutorials
- **[Basic Synthesis](docs/tutorials/basic-synthesis.md)** - End-to-end data generation
- **[Privacy Synthesis](docs/tutorials/privacy-synthesis.md)** - DP workflow tutorial
- **[Quality Assessment](docs/tutorials/quality-evaluation.md)** - Evaluation tutorial
- **[Compliance Reporting](docs/tutorials/compliance-reporting.md)** - Audit preparation

### 🛠️ Developer Resources
- **[Architecture](docs/developer-guide/architecture.md)** - System design and components
- **[Development Setup](docs/developer-guide/development-setup.md)** - Dev environment
- **[Testing](docs/developer-guide/testing.md)** - Testing guidelines and procedures
- **[Deployment](docs/developer-guide/deployment.md)** - Production deployment
- **[API Integration](docs/developer-guide/api-integration.md)** - Third-party integrations

### 📚 Reference
- **[Configuration Options](docs/reference/configuration-options.md)** - All config parameters
- **[Privacy Levels](docs/reference/privacy-levels.md)** - Epsilon/delta explanations
- **[Supported Formats](docs/reference/supported-formats.md)** - Data format specifications
- **[Troubleshooting](docs/reference/troubleshooting.md)** - Common issues and solutions

## 🏢 Use Cases

### 🏥 Healthcare & Life Sciences
- Generate synthetic patient data for ML model training
- Maintain HIPAA compliance with differential privacy
- Create test datasets without exposing PHI

### 💰 Financial Services
- Synthetic transaction data for fraud detection models
- Privacy-preserving customer analytics
- Regulatory compliance testing

### 📈 Enterprise Analytics
- Safe data sharing between departments
- Model validation and testing
- Customer data analytics without privacy risks

## 🔒 Privacy & Compliance

### Differential Privacy Levels
| Epsilon (ε) | Privacy Level | Use Case |
|-------------|---------------|----------|
| < 1.0 | Very Strong | Clinical trials, genomic data |
| 1-5 | Strong | Healthcare, financial records |
| 5-10 | Moderate | Customer data, HR records |
| 10-20 | Weak | Aggregated analytics |

### Compliance Frameworks
- ✅ **HIPAA** - Protected Health Information
- ✅ **GDPR** - General Data Protection Regulation
- ✅ **CCPA** - California Consumer Privacy Act
- ✅ **SOC-2** - Security, availability, and confidentiality

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details on:
- Development workflow
- Code standards
- Testing requirements
- Pull request process

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Community

- **📖 Documentation**: [Full Documentation Index](docs/index.md)
- **🐛 Issues**: [GitHub Issues](https://github.com/Urz1/synthetic-data-studio/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Urz1/synthetic-data-studio/discussions)
- **📧 Security**: security@synthetic-data-studio.com

## 🏆 Recognition

Built with cutting-edge privacy-preserving technologies:
- **FastAPI** - Modern Python web framework
- **SDV** - Synthetic Data Vault library
- **Opacus** - PyTorch differential privacy
- **Google Gemini & Groq** - AI-powered features

---

**Ready to get started?** Visit our [Quick Start Guide](docs/getting-started/quick-start.md) to generate your first synthetic dataset in minutes! 🚀
