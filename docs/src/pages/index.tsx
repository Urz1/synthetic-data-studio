import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {
  Lock,
  BarChart3,
  Sparkles,
  Building2,
  BookOpen,
  Code2,
  ArrowRight,
  Zap,
  Database,
  FileCheck,
  GitBranch,
  Terminal,
  ChevronRight,
  Play,
  Star,
  Cpu,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import styles from './index.module.css';



// Hero section with code preview
function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroSection}>
      <div className={styles.heroBackground}>
        <div className={styles.heroGradient} />
        <div className={styles.heroGrid} />
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
      </div>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.heroBadges}>
              <span className={styles.versionBadge}>v2.0</span>
              <span className={styles.heroBadge}>
                <Sparkles size={14} />
                Privacy-First Synthetic Data
              </span>
            </div>
            <Heading as="h1" className={styles.heroTitle}>
              Build with{' '}
              <span className={styles.gradientText}>Privacy-Safe</span>
              {' '}Synthetic Data
            </Heading>
            <p className={styles.heroSubtitle}>
              Generate high-quality synthetic datasets with mathematical privacy guarantees. 
              Self-hostable, open source, and built for production workloads.
            </p>
            <div className={styles.heroButtons}>
              <Link className={styles.primaryButton} to="/docs/getting-started/quick-start">
                <Play size={18} />
                Quick Start
                <ArrowRight size={16} />
              </Link>
              <Link className={styles.secondaryButton} to="/docs/developer-guide/api-integration">
                <Terminal size={18} />
                API Reference
              </Link>
            </div>
            <div className={styles.trustIndicators}>
              <div className={styles.trustItem}>
                <Lock size={16} />
                <span>Differential Privacy</span>
              </div>
              <div className={styles.trustItem}>
                <GitBranch size={16} />
                <span>Open Source</span>
              </div>
              <div className={styles.trustItem}>
                <Building2 size={16} />
                <span>Self-Hostable</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}

// Technology badges
function TechStack() {
  const techs = [
    { name: 'Python', color: '#3776AB' },
    { name: 'FastAPI', color: '#009688' },
    { name: 'PostgreSQL', color: '#336791' },
    { name: 'Redis', color: '#DC382D' },
    { name: 'Docker', color: '#2496ED' },
    { name: 'PyTorch', color: '#EE4C2C' },
  ];

  return (
    <section className={styles.techSection}>
      <div className="container">
        <p className={styles.techLabel}>Built with industry-standard technologies</p>
        <div className={styles.techGrid}>
          {techs.map((tech) => (
            <div key={tech.name} className={styles.techBadge} style={{ '--tech-color': tech.color } as React.CSSProperties}>
              {tech.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Feature card with icon
interface FeatureProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  color: string;
  link: string;
}

function FeatureCard({ title, description, Icon, color, link }: FeatureProps) {
  return (
    <Link to={link} className={styles.featureCard}>
      <div className={styles.featureIconWrapper} style={{ '--feature-color': color } as React.CSSProperties}>
        <Icon size={24} />
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
      <div className={styles.featureLink}>
        Learn more <ArrowRight size={14} />
      </div>
    </Link>
  );
}

const FeatureList: FeatureProps[] = [
  {
    title: 'Differential Privacy',
    Icon: Lock,
    color: '#8b5cf6',
    link: '/docs/user-guide/privacy-features',
    description: 'Mathematical privacy with RDP accounting. Provable protection against re-identification.',
  },
  {
    title: 'Multiple Generators',
    Icon: Cpu,
    color: '#06b6d4',
    link: '/docs/user-guide/generating-data',
    description: 'CTGAN, TVAE, GaussianCopula, TimeGAN. GPU-accelerated for production.',
  },
  {
    title: 'Quality Metrics',
    Icon: BarChart3,
    color: '#10b981',
    link: '/docs/user-guide/evaluating-quality',
    description: 'Statistical similarity, ML utility, and privacy leakage detection.',
  },
  {
    title: 'Compliance Reports',
    Icon: FileCheck,
    color: '#f59e0b',
    link: '/docs/tutorials/compliance-reporting',
    description: 'HIPAA, GDPR, CCPA packs with audit logs and model cards.',
  },
  {
    title: 'AI Insights',
    Icon: Sparkles,
    color: '#ec4899',
    link: '/docs/user-guide/ai-features',
    description: 'Chat with your data. Smart suggestions and auto-documentation.',
  },
  {
    title: 'Enterprise Ready',
    Icon: Building2,
    color: '#6366f1',
    link: '/docs/developer-guide/architecture',
    description: 'Async jobs, PostgreSQL/S3 storage. Docker-ready deployment.',
  },
];

function HomepageFeatures() {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Features</span>
          <h2>Everything you need for synthetic data</h2>
          <p>From privacy-preserving generation to quality evaluation and compliance reporting.</p>
        </div>
        <div className={styles.featuresGrid}>
          {FeatureList.map((props, idx) => (
            <FeatureCard key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Platform capabilities section - factual information only
function CapabilitiesSection() {
  const capabilities = [
    { value: '5+', label: 'Generator Models', icon: Cpu, desc: 'CTGAN, TVAE, GaussianCopula, TimeGAN, Schema' },
    { value: '4', label: 'Privacy Levels', icon: Lock, desc: 'None, Low, Medium, High (ε configurable)' },
    { value: '3', label: 'Export Formats', icon: Database, desc: 'CSV, JSON, Parquet' },
    { value: '100%', label: 'Open Source', icon: GitBranch, desc: 'MIT License, Self-hostable' },
  ];

  return (
    <section className={styles.statsSection}>
      <div className="container">
        <div className={styles.statsGrid}>
          {capabilities.map((cap, idx) => (
            <div key={idx} className={styles.statCard}>
              <cap.icon className={styles.statIcon} size={24} />
              <div className={styles.statValue}>{cap.value}</div>
              <div className={styles.statLabel}>{cap.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


// Documentation sections with cards
function DocSections() {
  const sections = [
    {
      title: 'Getting Started',
      description: 'Install and configure Synth Studio in under 5 minutes.',
      icon: Zap,
      color: '#8b5cf6',
      links: [
        { label: 'Installation', href: '/docs/getting-started/installation' },
        { label: 'Quick Start', href: '/docs/getting-started/quick-start' },
        { label: 'Configuration', href: '/docs/getting-started/configuration' },
      ],
    },
    {
      title: 'User Guide',
      description: 'Learn to upload, generate, and evaluate synthetic data.',
      icon: BookOpen,
      color: '#06b6d4',
      links: [
        { label: 'Uploading Data', href: '/docs/user-guide/uploading-data' },
        { label: 'Privacy Features', href: '/docs/user-guide/privacy-features' },
        { label: 'AI Features', href: '/docs/user-guide/ai-features' },
      ],
    },
    {
      title: 'Developer Guide',
      description: 'API integration, architecture, and deployment guides.',
      icon: Code2,
      color: '#10b981',
      links: [
        { label: 'API Integration', href: '/docs/developer-guide/api-integration' },
        { label: 'Architecture', href: '/docs/developer-guide/architecture' },
        { label: 'Deployment', href: '/docs/developer-guide/deployment' },
      ],
    },
    {
      title: 'Examples',
      description: 'Ready-to-use code samples and integration patterns.',
      icon: Layers,
      color: '#f59e0b',
      links: [
        { label: 'Python Client', href: '/docs/examples/python-client-examples' },
        { label: 'cURL Examples', href: '/docs/examples/curl-api-examples' },
        { label: 'LLM Testing', href: '/docs/examples/llm-api-testing-guide' },
      ],
    },
  ];

  return (
    <section className={styles.docSections}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>Documentation</span>
          <h2>Explore the docs</h2>
          <p>Find guides, tutorials, and references for every use case.</p>
        </div>
        <div className={styles.docGrid}>
          {sections.map((section, idx) => (
            <div key={idx} className={styles.docCard}>
              <div className={styles.docCardHeader} style={{ '--doc-color': section.color } as React.CSSProperties}>
                <section.icon size={24} />
                <h3>{section.title}</h3>
              </div>
              <p className={styles.docCardDesc}>{section.description}</p>
              <ul className={styles.docCardLinks}>
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link to={link.href}>
                      {link.label}
                      <ChevronRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA section
function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaContent}>
          <div className={styles.ctaIcon}>
            <GitBranch size={40} />
          </div>
          <h2>Ready to get started?</h2>
          <p>
            Deploy Synth Studio in minutes. Generate privacy-safe synthetic data today.
          </p>
          <div className={styles.ctaButtons}>
            <Link className={styles.ctaPrimary} to="/docs/getting-started/installation">
              <Zap size={18} />
              Start Building
              <ArrowRight size={16} />
            </Link>
            <Link className={styles.ctaSecondary} to="https://github.com/synthdata-studio/synth-studio" target="_blank">
              <Star size={18} />
              Star on GitHub
            </Link>
          </div>
          <p className={styles.ctaNote}>
            Free and open source. MIT License.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Documentation"
      description="Privacy-Preserving Synthetic Data Generation Platform">
      <HomepageHeader />
      <main>
        <TechStack />
        <HomepageFeatures />
        <CapabilitiesSection />
        <DocSections />
        <CTASection />
      </main>
    </Layout>
  );
}
