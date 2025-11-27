# Contributing to Synthetic Data Studio

Thank you for your interest in contributing to Synthetic Data Studio! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/synthetic-data-studio.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Set up development environment (see [Development Setup](docs/developer-guide/development-setup.md))
5. Make your changes
6. Run tests: `pytest`
7. Submit a pull request

## 📋 Development Workflow

### Branch Naming Convention
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation updates
- `refactor/refactor-description` - Code refactoring

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(auth): add OAuth2 login support

- Implement OAuth2 flow for Google and GitHub
- Add user profile synchronization
- Update authentication middleware

Closes #123
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with coverage
pytest --cov=app --cov-report=html

# Run integration tests only
pytest -m integration
```

### Test Coverage Requirements
- Minimum 80% code coverage
- All new features must include tests
- All bug fixes should include regression tests

### Test Categories
- **Unit Tests**: Test individual functions/classes
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Security Tests**: Test authentication and authorization

## 📝 Code Style

### Python Code Style
We follow PEP 8 with some modifications:

```python
# Good
def calculate_privacy_budget(epsilon: float, delta: float) -> float:
    """Calculate privacy budget using RDP accounting."""
    return epsilon * math.sqrt(2 * math.log(1 / delta))

# Avoid
def calc_priv_budget(e,d):
    return e*math.sqrt(2*math.log(1/d))
```

### Key Guidelines
- Use type hints for all function parameters and return values
- Write descriptive docstrings using Google style
- Keep functions under 50 lines when possible
- Use meaningful variable names
- Follow the existing code patterns in the codebase

### Linting
```bash
# Run linting
flake8 app/ tests/

# Auto-format code
black app/ tests/
isort app/ tests/
```

## 🔒 Security Considerations

### Privacy & Security Requirements
- All changes must maintain differential privacy guarantees
- Never log sensitive data or PII
- Validate all user inputs
- Use secure defaults for privacy parameters
- Document security implications of changes

### Security Testing
```bash
# Run security tests
pytest tests/security/

# Check for common vulnerabilities
bandit -r app/
```

## 📚 Documentation

### Documentation Standards
- Update documentation for any user-facing changes
- Include code examples in docstrings
- Keep API documentation synchronized with code
- Test documentation examples

### Documentation Updates Required For:
- New features or endpoints
- Changes to existing APIs
- Configuration option changes
- Security or privacy implications

## 🔄 Pull Request Process

### Before Submitting
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Commit messages follow format

### PR Template
Please use the PR template and include:
- Description of changes
- Testing instructions
- Breaking changes (if any)
- Security implications
- Related issues

### Review Process
1. Automated checks (tests, linting, security)
2. Peer review by maintainers
3. Security review for privacy-related changes
4. Merge approval

## 🐛 Reporting Issues

### Bug Reports
Please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python version, etc.)
- Relevant logs or error messages

### Feature Requests
Please include:
- Use case description
- Proposed solution
- Alternative approaches considered
- Impact assessment

## 📞 Getting Help

- **Documentation**: [docs/index.md](docs/index.md)
- **Discussions**: GitHub Discussions
- **Issues**: GitHub Issues
- **Security Issues**: security@synthetic-data-studio.com (private)

## 🎯 Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards.

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

Thank you for contributing to Synthetic Data Studio! 🎉</content>
</xai:function_call