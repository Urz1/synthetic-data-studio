import React, { useState, useCallback } from 'react';

interface ParamProps {
  /** Parameter name to display */
  name: string;
  /** Optional type annotation */
  type?: string;
  /** Whether to show copy button (default: true) */
  copyable?: boolean;
}

/**
 * Param Component
 * 
 * Inline code-styled parameter display with optional copy button.
 * Used for API parameters, configuration options, and code references.
 * 
 * @example
 * ```mdx
 * Set <Param name="epsilon" type="float" /> to configure privacy budget.
 * The <Param name="SYNTH_STUDIO_SECRET_KEY" /> environment variable is required.
 * ```
 */
export function Param({ name, type, copyable = true }: ParamProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [name]);

  return (
    <span className="param">
      <span className="param__name">{name}</span>
      {type && <span className="param__type">{type}</span>}
      {copyable && (
        <button
          className={`param__copy ${copied ? 'param__copy--copied' : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy to clipboard'}
          type="button"
          aria-label={copied ? 'Copied!' : `Copy ${name} to clipboard`}
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          )}
        </button>
      )}
    </span>
  );
}

export default Param;
