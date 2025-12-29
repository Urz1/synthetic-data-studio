# Contact & Contribution Guide

## 👤 Project Developer

**Sadam Husen**

- 📧 **Email**: halisadam391@gmail.com
- 💼 **LinkedIn**: [linkedin.com/in/sadam-husen-16s](https://www.linkedin.com/in/sadam-husen-16s/)
- 🐙 **GitHub**: [github.com/Urz1](https://github.com/Urz1)
- 🔗 **Repository**: [github.com/Urz1/synthetic-data-studio](https://github.com/Urz1/synthetic-data-studio)

---

## 📬 Getting in Touch

### For General Questions

- **Email**: halisadam391@gmail.com
- **Response Time**: Usually within 24-48 hours

### For Bug Reports

1. Open an issue on [GitHub Issues](https://github.com/Urz1/synthetic-data-studio/issues)
2. Use the bug report template
3. Include detailed steps to reproduce
4. Attach error logs if applicable

### For Feature Requests

1. Open an issue on GitHub
2. Use the feature request template
3. Describe the use case and benefits
4. Discuss implementation approach

### For Technical Support

- **Email**: halisadam391@gmail.com with subject "Synth Studio Support"
- Include:
  - Your environment (OS, Node version, Python version)
  - What you're trying to do
  - Error messages or unexpected behavior
  - Steps already tried

### For Collaboration

- **LinkedIn**: Best for professional networking and collaboration
- **Email**: For detailed project discussions
- Open to:
  - Contributing to the project
  - Consulting opportunities
  - Speaking at events
  - Writing technical content

---

## 🤝 Contributing

### Ways to Contribute

1. **Code Contributions**

   - Fix bugs
   - Add new features
   - Improve performance
   - Enhance UI/UX

2. **Documentation**

   - Fix typos and errors
   - Add examples
   - Translate documentation
   - Write tutorials

3. **Testing**

   - Report bugs
   - Test new features
   - Write test cases
   - Improve test coverage

4. **Design**
   - UI/UX improvements
   - Logo and branding
   - Documentation design
   - Visual assets

### Contribution Process

1. **Fork the Repository**

   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/synthetic-data-studio.git
   cd synthetic-data-studio
   ```

2. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Your Changes**

   - Follow the code style guidelines
   - Write clear commit messages
   - Add tests for new features
   - Update documentation

4. **Test Your Changes**

   ```bash
   # Frontend
   cd frontend
   pnpm lint
   pnpm tsc --noEmit
   pnpm build

   # Backend
   cd backend
   pytest tests/ -v
   ```

5. **Commit and Push**

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Describe your changes clearly
   - Reference any related issues

### Code Style Guidelines

#### Frontend (TypeScript/React)

```typescript
// Use functional components with TypeScript
interface Props {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: Props) {
  return (
    <div className="p-4">
      <h1>{title}</h1>
      <button onClick={onAction}>Action</button>
    </div>
  );
}

// Use meaningful variable names
const isUserAuthenticated = true; // ✅
const flag = true; // ❌

// Keep components small and focused
// Extract complex logic into custom hooks
```

#### Backend (Python/FastAPI)

```python
# Follow PEP 8 style guide
# Use type hints
from typing import List, Optional
from fastapi import APIRouter

router = APIRouter()

@router.get("/items", response_model=List[Item])
async def get_items(
    skip: int = 0,
    limit: int = 100,
    user: User = Depends(get_current_user)
) -> List[Item]:
    """
    Retrieve items with pagination.

    Args:
        skip: Number of items to skip
        limit: Maximum number of items to return
        user: Current authenticated user

    Returns:
        List of items
    """
    return await item_service.get_items(skip, limit, user.id)

# Use meaningful function and variable names
# Add docstrings to all functions
# Keep functions small and focused
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new synthetic data generator
fix: resolve authentication token expiry issue
docs: update API documentation with examples
style: format code with prettier
refactor: simplify data processing pipeline
test: add unit tests for user service
chore: update dependencies to latest versions
```

### Pull Request Guidelines

1. **Title**: Clear and descriptive

   - ✅ `feat: Add HIPAA compliance reporting`
   - ❌ `Update stuff`

2. **Description**: Include:

   - What changes were made
   - Why these changes are needed
   - How to test the changes
   - Screenshots (for UI changes)
   - Related issues

3. **Checklist**:
   - [ ] Code follows style guidelines
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] All tests pass
   - [ ] No linting errors
   - [ ] Changelog updated (if applicable)

---

## 🐛 Reporting Issues

### Before Reporting

1. **Search existing issues**: Your issue might already be reported
2. **Update to latest version**: Bug might be fixed
3. **Check documentation**: Might be expected behavior

### Issue Template

```markdown
**Description**
Clear description of the issue

**Steps to Reproduce**

1. Go to '...'
2. Click on '....'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**

- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Node Version: [e.g., 18.17.0]
- Python Version: [e.g., 3.9.7]
- Browser: [e.g., Chrome 120]

**Screenshots**
If applicable

**Error Messages**
```

Paste error logs here

```

**Additional Context**
Any other relevant information
```

---

## 💼 Professional Services

### Available For

- **Consulting**: Architecture, scalability, security reviews
- **Custom Development**: Feature implementation, integration
- **Training**: Team training on synthetic data and privacy
- **Speaking**: Tech talks, conference presentations
- **Code Review**: Architecture and code quality audits

### Rates & Engagement

Contact via email for:

- Hourly rates
- Project-based pricing
- Long-term engagements
- Enterprise support contracts

---

## 🌟 Recognition

### Contributors

Thank you to all contributors! Your contributions are greatly appreciated.

Want to be listed here? Make a contribution!

### Sponsors

Interested in sponsoring this project?

- Contact via email
- GitHub Sponsors (coming soon)

---

## 📚 Resources

### Learning Materials

- **Documentation**: Complete guides in `/docs`
- **Examples**: Code samples in `/docs/docs/examples`
- **Tutorials**: Step-by-step guides in `/docs/docs/tutorials`

### Community

- **Discussions**: GitHub Discussions (coming soon)
- **Stack Overflow**: Tag questions with `synth-studio`
- **Discord**: Community server (coming soon)

### Stay Updated

- **GitHub**: Watch repository for updates
- **LinkedIn**: Follow for project updates and insights
- **Email Newsletter**: Coming soon

---

## 📋 FAQ

### How can I get help?

1. Check documentation first
2. Search existing GitHub issues
3. Ask in GitHub Discussions
4. Email for direct support: halisadam391@gmail.com

### Can I use this commercially?

Yes! This project is MIT licensed. You're free to use it commercially.

### How do I report security vulnerabilities?

**Do not** open a public issue. Email directly to: halisadam391@gmail.com with:

- Subject: "Security Vulnerability Report"
- Detailed description of the vulnerability
- Steps to reproduce
- Potential impact

### Can you build a custom feature for me?

Yes! Contact via email to discuss:

- Feature requirements
- Timeline
- Budget
- Ongoing support

### Do you offer training?

Yes! Available for:

- Team training sessions
- Workshop facilitation
- One-on-one mentoring
- Conference talks

Contact via email or LinkedIn to discuss.

---

## 🙏 Acknowledgments

### Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, SQLAlchemy, Celery, Python
- **ML/Privacy**: SDV, Opacus, CTGAN, TVAE
- **Infrastructure**: PostgreSQL, Redis, AWS S3, Vercel

### Special Thanks

To all the open-source projects and communities that made this possible.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

**What this means:**

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

---

## 📞 Quick Contact

**Need immediate help?**

📧 **Email**: halisadam391@gmail.com  
💼 **LinkedIn**: [sadam-husen-16s](https://www.linkedin.com/in/sadam-husen-16s/)  
🐙 **GitHub**: [@Urz1](https://github.com/Urz1)

**Response Time**: Usually within 24-48 hours

---

_Last Updated: December 7, 2025_  
_Maintained by: Sadam Husen_
