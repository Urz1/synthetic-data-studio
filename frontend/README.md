# Synth Studio Frontend

Modern, privacy-first synthetic data generation platform built with Next.js 16, React 19, and TypeScript.

## 🎯 Overview

The Synth Studio frontend provides an intuitive, production-ready interface for generating privacy-safe synthetic data with differential privacy guarantees. Built for healthcare and fintech startups requiring HIPAA, GDPR, and SOC-2 compliance.

## ✨ Features

- **🎨 Modern UI**: Built with shadcn/ui, Radix UI, and Tailwind CSS
- **🔐 Secure Authentication**: OAuth (Google, GitHub) + email/password with JWT
- **📊 Interactive Dashboards**: Real-time metrics, data visualization, and quality reports
- **🤖 AI Assistant**: Integrated AI-powered chat for guidance and automation
- **⚡ Performance**: Optimized for <1s load times with webpack bundling
- **♿ Accessible**: WCAG 2.1 AA compliant with full keyboard navigation
- **🌓 Dark Mode**: System-aware theme with manual toggle
- **📱 Responsive**: Mobile-first design that works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or 20+
- pnpm 9+ (recommended) or npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Clone the repository
git clone https://github.com/Urz1/synthetic-data-studio.git
cd synthetic-data-studio/frontend

# Install dependencies
pnpm install

# Copy environment file
cp .env.local.example .env.local

# Configure environment variables
# Edit .env.local with your settings

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
frontend/
├── app/                        # Next.js App Router pages
│   ├── (auth)/                # Authentication pages (login, register)
│   ├── assistant/             # AI assistant chat interface
│   ├── audit/                 # Admin-only audit logs (requires admin role)
│   ├── billing/               # Admin-only billing management
│   ├── compliance/            # Admin-only compliance reports
│   ├── dashboard/             # Main dashboard
│   ├── datasets/              # Dataset management
│   ├── evaluations/           # Quality evaluation reports
│   ├── exports/               # Admin-only export management
│   ├── generators/            # Synthetic data generators
│   ├── jobs/                  # Background job monitoring
│   ├── projects/              # Project management
│   ├── settings/              # User settings
│   ├── error.tsx              # Global error boundary
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── components/
│   ├── layout/                # Layout components (AppShell, PageHeader)
│   ├── ui/                    # shadcn/ui components
│   ├── datasets/              # Dataset-specific components
│   ├── evaluations/           # Evaluation components
│   └── generators/            # Generator components
├── lib/
│   ├── api.ts                 # API client
│   ├── auth-context.tsx       # Authentication context
│   ├── types.ts               # TypeScript types
│   └── utils.ts               # Utility functions
├── hooks/                     # Custom React hooks
├── public/                    # Static assets
├── styles/                    # Global styles
├── next.config.mjs            # Next.js configuration
├── tailwind.config.cjs        # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## 🔐 Authentication & Authorization

### User Roles

- **Regular User**: Access to datasets, generators, evaluations, projects, jobs, assistant, settings
- **Admin**: Additional access to exports, compliance, audit, and billing pages

### OAuth Setup

Configure OAuth providers in `.env.local`:

```bash
# Google OAuth
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id

# GitHub OAuth
NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

## 🛠️ Development

### Available Scripts

```bash
# Development server with HMR
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Analyze bundle size
pnpm build:analyze
```

### Environment Variables

Create a `.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# OAuth Providers
NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Code Quality

- **TypeScript**: Full type safety across the codebase
- **ESLint**: Enforced linting rules with `eslint-config-next`
- **Prettier**: Code formatting (integrated with ESLint)
- **Git Hooks**: Pre-commit linting (optional)

## 📦 Tech Stack

### Core
- **Next.js 16**: React framework with App Router
- **React 19**: UI library with Server Components
- **TypeScript**: Type-safe development

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **Radix UI**: Accessible component primitives
- **Lucide React**: Modern icon library
- **Framer Motion**: Smooth animations

### State & Data
- **React Context**: Global state management
- **React Hooks**: Local state and side effects
- **TanStack Table**: Powerful data tables

### Forms & Validation
- **React Hook Form**: Performant form handling
- **Zod**: Schema validation

## 🎨 Theming

The application supports light and dark modes with system preference detection:

```typescript
// Use the theme toggle component
import { ThemeToggle } from "@/components/layout/theme-toggle"

// Or access theme programmatically
import { useTheme } from "next-themes"
const { theme, setTheme } = useTheme()
```

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Docker

```bash
# Build image
docker build -t synth-studio-frontend .

# Run container
docker run -p 3000:3000 synth-studio-frontend
```

### Environment Variables for Production

Ensure these are set in your deployment environment:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=production_google_client_id
NEXT_PUBLIC_GITHUB_CLIENT_ID=production_github_client_id
```

## 📊 Performance

- **Lighthouse Score**: 95+ across all categories
- **Bundle Size**: < 200KB initial load (gzipped)
- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s

### Optimization Techniques
- Webpack bundling for stable module resolution
- Route-based code splitting
- Image optimization with Next.js Image component
- Font optimization with `next/font`
- API response caching

## 🔒 Security

- **Content Security Policy**: Configured for XSS protection
- **JWT Authentication**: Secure token-based auth
- **HTTPS Only**: Enforced in production
- **Input Validation**: Client and server-side validation
- **Role-Based Access Control**: Admin-only routes protected

## 🐛 Troubleshooting

### Common Issues

**HMR Errors**: The app uses webpack instead of Turbopack for stability. If you experience HMR issues:
```bash
# Clean .next cache
rm -rf .next
pnpm dev
```

**OAuth Not Working**: Ensure OAuth apps are configured correctly and callback URLs match:
- Google: `http://localhost:3000/auth/google/callback`
- GitHub: `http://localhost:3000/auth/github/callback`

**API Connection Failed**: Verify backend is running and `NEXT_PUBLIC_API_BASE_URL` is correct.

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

- **Documentation**: [Backend README](../backend/README.md)
- **Issues**: [GitHub Issues](https://github.com/Urz1/synthetic-data-studio/issues)
- **Email**: support@synthstudio.com
