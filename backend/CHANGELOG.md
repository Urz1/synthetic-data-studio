# Changelog

All notable changes to Synthetic Data Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- AI-powered features with LLM integration
- Interactive chat for evaluation exploration
- Smart improvement suggestions
- Natural language metric explanations
- Auto-generated model cards and audit narratives
- Enhanced PII detection with context awareness

### Changed
- Improved differential privacy validation system
- Enhanced evaluation suite with comprehensive quality metrics
- Updated API documentation structure

### Fixed
- Various import and configuration issues
- API endpoint consistency
- Documentation accuracy

## [1.0.0] - 2025-11-27

### Added
- Complete evaluation suite with statistical similarity, ML utility, and privacy tests
- Differential privacy support with RDP accounting (DP-CTGAN, DP-TVAE)
- Comprehensive safety validation system for privacy guarantees
- Background job processing for long-running synthesis tasks
- Model management and versioning system
- Compliance reporting for GDPR, HIPAA, CCPA, SOC-2
- Advanced PII/PHI detection with recommendations
- Multiple synthesis methods (CTGAN, TVAE, GaussianCopula)
- Dataset profiling with statistical analysis and correlation matrices

### Changed
- Migrated from schema-based generation to ML-based synthesis
- Enhanced database schema to support privacy metadata
- Improved API structure with comprehensive endpoint coverage

### Technical Details
- **Backend**: FastAPI with SQLModel/SQLAlchemy
- **Synthesis**: SDV library with Opacus for differential privacy
- **AI Features**: Google Gemini and Groq integration
- **Database**: SQLite (development) / PostgreSQL (production)
- **Deployment**: Docker with production-ready configurations

---

## Types of Changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

---

## Version History

### Pre-1.0.0 Development Phases

#### Phase 4: Evaluation Suite (Completed)
- Statistical similarity testing (KS, Chi-square, Wasserstein, JS Divergence)
- ML utility evaluation for classification/regression tasks
- Privacy leakage detection (membership inference, attribute inference)
- Comprehensive quality reports with actionable recommendations

#### Phase 3: Differential Privacy (Completed)
- DP-CTGAN and DP-TVAE implementations with RDP accounting
- 3-layer safety validation (pre-training, math verification, post-training checks)
- Privacy budget tracking and reporting
- Compliance framework mappings

#### Phase 2: ML-Based Synthesis (Completed)
- CTGAN, TVAE, and GaussianCopula synthesis methods
- Configurable hyperparameters and training pipelines
- Model artifact storage and persistence

#### Phase 1: Data Profiling & PII Detection (Completed)
- Statistical profiling with correlation analysis
- Automated PII/PHI detection with confidence scoring
- Dataset validation and type inference

---

For more detailed information about each phase, see the archived documentation in `docs/archive/`.</content>
</xai:function_call