import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

// SVG Icon components (inline for zero external dependencies)
const Icons = {
  Lock: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Bot: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 8V4H8"/>
      <rect width="16" height="12" x="4" y="8" rx="2"/>
      <path d="M2 14h2"/>
      <path d="M20 14h2"/>
      <path d="M15 13v2"/>
      <path d="M9 13v2"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" x2="12" y1="20" y2="10"/>
      <line x1="18" x2="18" y1="20" y2="4"/>
      <line x1="6" x2="6" y1="20" y2="16"/>
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  Sparkles: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  ),
  Building: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  ),
  BookOpen: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  Code: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Shield: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    </svg>
  ),
};

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeatureItem({title, description, Icon}: {title: string; description: string; Icon: React.ComponentType}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md" style={{padding: '2rem'}}>
        <div style={{marginBottom: '1rem', color: 'var(--ifm-color-primary)'}}>
          <Icon />
        </div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

const FeatureList = [
  {
    title: 'Differential Privacy',
    Icon: Icons.Lock,
    description: 'Mathematical privacy guarantees with differential privacy. RDP accounting, DP-SGD, and safety validation built-in.',
  },
  {
    title: 'Multiple Generators',
    Icon: Icons.Bot,
    description: 'CTGAN, TVAE, GaussianCopula, TimeGAN, and Schema-based generators. GPU-accelerated for production workloads.',
  },
  {
    title: 'Quality Evaluation',
    Icon: Icons.BarChart,
    description: 'Statistical similarity, ML utility, privacy leakage detection. Comprehensive reports with actionable insights.',
  },
  {
    title: 'Compliance Ready',
    Icon: Icons.ShieldCheck,
    description: 'HIPAA, GDPR, CCPA, SOC-2 compliance packs. Audit logs, model cards, and exportable PDF reports.',
  },
  {
    title: 'AI-Powered Insights',
    Icon: Icons.Sparkles,
    description: 'Interactive chat to understand your synthetic data quality. Smart suggestions and auto-generated documentation.',
  },
  {
    title: 'Enterprise Architecture',
    Icon: Icons.Building,
    description: 'FastAPI backend, async job processing, PostgreSQL/S3 storage. Production-ready with Docker deployment.',
  },
];

function HomepageFeatures() {
  return (
    <section style={{padding: '4rem 0'}}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <FeatureItem key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <section style={{padding: '3rem 0', backgroundColor: 'var(--ifm-background-surface-color)'}}>
      <div className="container">
        <div className="row">
          <div className="col col--4">
            <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Icons.BookOpen /> Learn
            </h3>
            <ul>
              <li><Link to="/docs/getting-started/quick-start">Quick Start Guide</Link></li>
              <li><Link to="/docs/user-guide/overview">User Guide</Link></li>
              <li><Link to="/docs/tutorials/basic-synthesis">Tutorials</Link></li>
            </ul>
          </div>
          <div className="col col--4">
            <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Icons.Code /> Develop
            </h3>
            <ul>
              <li><Link to="/docs/developer-guide/api-integration">API Integration</Link></li>
              <li><Link to="/docs/examples/python-client-examples">Python Examples</Link></li>
              <li><Link to="/docs/developer-guide/architecture">Architecture</Link></li>
            </ul>
          </div>
          <div className="col col--4">
            <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Icons.Shield /> Privacy
            </h3>
            <ul>
              <li><Link to="/docs/user-guide/privacy-features">Privacy Features</Link></li>
              <li><Link to="/docs/reference/privacy-levels">Privacy Levels</Link></li>
              <li><Link to="/docs/tutorials/compliance-reporting">Compliance Reporting</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Documentation"
      description="Privacy-Preserving Synthetic Data Generation Platform">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickLinks />
      </main>
    </Layout>
  );
}
