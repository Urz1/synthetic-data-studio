# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-07 (Production Ready)

### Added
- Complete authentication system with JWT + OAuth (Google, GitHub)
- Role-based access control (user/admin roles)
- Admin-only features: Audit logs, Compliance reports, Billing, Exports
- Full-width responsive layout across all pages
- Sign out functionality with proper redirects
- Comprehensive documentation suite:
  - `DEPLOYMENT.md` - Production deployment guide
  - `PROJECT_SUMMARY.md` - Complete project overview
  - `PRE_DEPLOYMENT_CHECKLIST.md` - 200+ item checklist
  - `QUICK_REFERENCE.md` - Common commands reference
  - `CONTACT.md` - Contact and contribution guide
  - `CLEANUP_UPDATE_SUMMARY.md` - Cleanup operations summary
  - `frontend/README.md` - Frontend documentation
- Automated cleanup scripts (`cleanup_and_update.bat/sh`)
- Aggressive cleanup script to remove unnecessary folders
- Contact information integrated across all documentation
- Enhanced .gitignore with comprehensive security exclusions

### Changed
- Refactored app-shell layout for full-width content display
- Updated protected routes with admin-only access checking
- Improved navigation with conditional admin section rendering
- Logout now redirects to landing page instead of login
- Updated main README with architecture and quick start guide
- Enhanced documentation structure and organization

### Fixed
- Full-width layout issues on all pages
- React hydration errors from nested containers
- Logo visibility when sidebar collapsed
- Admin access control enforcement
- Navigation item rendering based on user role

### Removed
- SidebarInset component (causing layout issues)
- Nested layout containers
- Max-width constraints on content areas

## [0.1.0] - 2025-03-08 (MVP Initial Release)
### Added
- Initial repository structure and foundational files.
- Comprehensive `README.md` with project overview, features, value proposition, and architecture.
- High-level architecture diagram in `docs/architecture.md`.
- Initial `docker-compose.yml` for local development setup.
- Basic FastAPI backend skeleton (`backend/`).
- Placeholder React/Streamlit frontend skeleton (`frontend/`).
- Core ML model directories (`ml_models/`).
- Extensive documentation placeholders (`docs/`).
- `.gitignore` for Python, Node.js, Docker, and ML artifacts.
- MIT License.
- `CHANGELOG.md` and `CONTRIBUTING.md`.
- Initial `requirements.txt` files for `backend`, `frontend`, `ml_models`.

### Changed
- N/A

### Fixed
- N/A

### Removed
- N/A
