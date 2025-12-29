# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Synthetic Data Studio seriously. If you believe you've found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

📧 **halisadam391@gmail.com**

Please include the following information in your report:

- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Initial Response**: Within 48 hours of your report
- **Status Update**: Within 7 days with our assessment
- **Resolution Timeline**: We aim to resolve critical vulnerabilities within 30 days

### Safe Harbor

We consider security research conducted consistent with this policy to constitute "authorized" conduct under the Computer Fraud and Abuse Act (CFAA) and similar laws. We will not pursue or support any legal action against you for accidental, good-faith violations of this policy.

## Security Best Practices

When deploying Synth Studio, please ensure:

### Authentication & Authorization

- [ ] Use strong, unique JWT secrets (32+ characters)
- [ ] Enable refresh token rotation
- [ ] Set appropriate token expiration times
- [ ] Use HTTPS in production

### Data Protection

- [ ] Encrypt data at rest (S3 encryption, database encryption)
- [ ] Use TLS 1.3 for data in transit
- [ ] Enable differential privacy for sensitive datasets
- [ ] Review PII detection results before sharing data

### Infrastructure

- [ ] Keep all dependencies updated
- [ ] Use environment variables for secrets (never commit to git)
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Use WAF in production

### Compliance

- [ ] Review HIPAA requirements for healthcare data
- [ ] Review GDPR requirements for EU data
- [ ] Maintain audit logs
- [ ] Generate compliance reports regularly

## Security Features

Synth Studio includes the following security features:

- **Differential Privacy**: Mathematical privacy guarantees (ε-DP)
- **PII/PHI Detection**: Automatic sensitive data identification
- **Audit Logging**: Immutable activity records
- **Role-Based Access Control**: User and admin roles
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Protection against injection attacks
- **CORS Configuration**: Controlled cross-origin access

## Acknowledgments

We appreciate security researchers who help keep Synth Studio and our users safe. Responsible disclosure helps us improve security for everyone.

Thank you for helping keep Synth Studio secure! 🔒
