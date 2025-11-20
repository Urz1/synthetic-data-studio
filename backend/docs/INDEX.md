# Documentation Index

## 📁 Documentation Structure

### Root Documentation
- [README.md](../README.md) - Project overview and getting started
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Original implementation roadmap

### Phase Documentation

#### Phase 1: Data Profiling & PII Detection
- [PHASE1_SUMMARY.md](phase1/PHASE1_SUMMARY.md) - Statistical profiling and PII detection implementation

#### Phase 2: Synthesis Models
- [PHASE2_SUMMARY.md](phase2/PHASE2_SUMMARY.md) - CTGAN, TVAE, and GaussianCopula implementation

#### Phase 3: Differential Privacy
- [PHASE3_SUMMARY.md](phase3/PHASE3_SUMMARY.md) - DP-CTGAN and DP-TVAE with privacy guarantees
- [PHASE3_TESTING.md](phase3/PHASE3_TESTING.md) - Testing guide for DP features
- [PHASE3_QUICKREF.md](phase3/PHASE3_QUICKREF.md) - Quick reference for DP usage
- [PHASE3_SAFETY_SUMMARY.md](phase3/PHASE3_SAFETY_SUMMARY.md) - Safety features and bug fixes
- [PHASE3_SAFETY_TESTING.md](phase3/PHASE3_SAFETY_TESTING.md) - Safety system testing guide
- [PHASE3_SAFETY_QUICKREF.md](phase3/PHASE3_SAFETY_QUICKREF.md) - Safety features quick reference
- [PHASE3_SAFETY_ARCHITECTURE.md](phase3/PHASE3_SAFETY_ARCHITECTURE.md) - System architecture and flow diagrams
- [PHASE3_SAFETY_API_EXAMPLES.md](phase3/PHASE3_SAFETY_API_EXAMPLES.md) - Ready-to-run API test examples

### Testing & Development Guides
- [TESTING.md](guides/TESTING.md) - General testing guidelines
- [GENERATOR_TESTS.md](guides/GENERATOR_TESTS.md) - Generator-specific test cases

---

## 🚀 Quick Navigation

### For New Developers
1. Start with [README.md](../README.md)
2. Review [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
3. Follow phase documentation in order (Phase 1 → 2 → 3)

### For API Users
- **DP Configuration**: [PHASE3_SAFETY_QUICKREF.md](phase3/PHASE3_SAFETY_QUICKREF.md)
- **API Examples**: [PHASE3_SAFETY_API_EXAMPLES.md](phase3/PHASE3_SAFETY_API_EXAMPLES.md)
- **Testing Guide**: [PHASE3_SAFETY_TESTING.md](phase3/PHASE3_SAFETY_TESTING.md)

### For Compliance/Privacy Officers
- **Privacy Overview**: [PHASE3_SUMMARY.md](phase3/PHASE3_SUMMARY.md)
- **Safety Features**: [PHASE3_SAFETY_SUMMARY.md](phase3/PHASE3_SAFETY_SUMMARY.md)
- **Architecture**: [PHASE3_SAFETY_ARCHITECTURE.md](phase3/PHASE3_SAFETY_ARCHITECTURE.md)

---

## 📊 Feature Status

| Phase | Feature | Status | Documentation |
|-------|---------|--------|---------------|
| 1 | Statistical Profiling | ✅ Complete | [PHASE1_SUMMARY.md](phase1/PHASE1_SUMMARY.md) |
| 1 | PII/PHI Detection | ✅ Complete | [PHASE1_SUMMARY.md](phase1/PHASE1_SUMMARY.md) |
| 2 | CTGAN Synthesis | ✅ Complete | [PHASE2_SUMMARY.md](phase2/PHASE2_SUMMARY.md) |
| 2 | TVAE Synthesis | ✅ Complete | [PHASE2_SUMMARY.md](phase2/PHASE2_SUMMARY.md) |
| 2 | GaussianCopula | ✅ Complete | [PHASE2_SUMMARY.md](phase2/PHASE2_SUMMARY.md) |
| 3 | DP-CTGAN | ✅ Complete | [PHASE3_SUMMARY.md](phase3/PHASE3_SUMMARY.md) |
| 3 | DP-TVAE | ✅ Complete | [PHASE3_SUMMARY.md](phase3/PHASE3_SUMMARY.md) |
| 3 | Privacy Reports | ✅ Complete | [PHASE3_SUMMARY.md](phase3/PHASE3_SUMMARY.md) |
| 3 | Safety System | ✅ Complete | [PHASE3_SAFETY_SUMMARY.md](phase3/PHASE3_SAFETY_SUMMARY.md) |
| 4 | Evaluation Suite | 🔄 Planned | TBD |
| 5 | Compliance System | 🔄 Planned | TBD |
| 6 | Production Ready | 🔄 Planned | TBD |

---

## 🔧 API Endpoints Reference

### Data Profiling
- `POST /datasets/{id}/profile` - Generate statistical profile
- `GET /datasets/{id}/profile` - Retrieve profile
- `POST /datasets/{id}/detect-pii` - Detect PII/PHI

### Synthesis
- `POST /generators/dataset/{id}/generate` - Generate synthetic data
- `POST /generators/schema/generate` - Generate from schema
- `GET /generators/{id}` - Get generator details

### Differential Privacy
- `POST /generators/dp/validate-config` - Validate DP configuration
- `GET /generators/dp/recommended-config` - Get safe DP parameters
- `GET /generators/{id}/privacy-report` - Get privacy report

---

## 📞 Support & Resources

- **API Documentation**: http://localhost:8000/docs (when server is running)
- **Issue Tracking**: See project repository
- **Testing**: Start with [TESTING.md](guides/TESTING.md)

---

## 🎓 Learning Path

### Beginner: Understanding Synthetic Data
1. Read [README.md](../README.md) overview
2. Review Phase 1 (profiling basics)
3. Try basic CTGAN synthesis (Phase 2)

### Intermediate: Working with Privacy
1. Study Phase 3 overview
2. Follow [PHASE3_SAFETY_QUICKREF.md](phase3/PHASE3_SAFETY_QUICKREF.md)
3. Test with [PHASE3_SAFETY_API_EXAMPLES.md](phase3/PHASE3_SAFETY_API_EXAMPLES.md)

### Advanced: Privacy Engineering
1. Deep dive into [PHASE3_SAFETY_ARCHITECTURE.md](phase3/PHASE3_SAFETY_ARCHITECTURE.md)
2. Review safety validation implementation
3. Understand RDP accounting and composition

---

Last Updated: November 20, 2025
