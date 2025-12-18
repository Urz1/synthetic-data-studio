import React from 'react';

type BadgeType = 'HIPAA' | 'GDPR' | 'CCPA' | 'SOC2';

interface BadgeProps {
  /** Compliance badge type */
  type: BadgeType;
  /** Optional link (for audit letters, if available) */
  href?: string;
}

/**
 * Badge icons for each compliance type
 */
const BadgeIcons: Record<BadgeType, React.ReactNode> = {
  HIPAA: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  GDPR: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  CCPA: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
    </svg>
  ),
  SOC2: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

/**
 * Badge display text for each type
 */
const BadgeLabels: Record<BadgeType, string> = {
  HIPAA: 'HIPAA',
  GDPR: 'GDPR',
  CCPA: 'CCPA',
  SOC2: 'SOC 2',
};

/**
 * Badge Component
 * 
 * Compliance badges for HIPAA, GDPR, CCPA, and SOC-2.
 * Optionally links to audit documentation.
 * 
 * @example
 * ```mdx
 * <BadgeGroup>
 *   <Badge type="HIPAA" />
 *   <Badge type="GDPR" />
 *   <Badge type="SOC2" />
 * </BadgeGroup>
 * ```
 */
export function Badge({ type, href }: BadgeProps): React.JSX.Element {
  const className = `badge badge--${type.toLowerCase()}`;
  const content = (
    <>
      <span className="badge__icon">{BadgeIcons[type]}</span>
      <span>{BadgeLabels[type]}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <span className={className}>{content}</span>;
}

/**
 * BadgeGroup Component
 * 
 * Container for grouping multiple badges together.
 */
export function BadgeGroup({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="badge-group">{children}</div>;
}

export default Badge;
