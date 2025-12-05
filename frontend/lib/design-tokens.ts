/**
 * Design Tokens for Progressive Disclosure UX
 *
 * Centralized design system following:
 * - 8-pt spacing grid
 * - 400-500ms animations
 * - Neutral-warm grayscale
 * - Color reserved for status and CTAs only
 */

export const DESIGN_TOKENS = {
  /**
   * 8-point spacing system
   */
  spacing: {
    base: 8,
    xs: 4, // 4px
    sm: 8, // 8px
    md: 16, // 16px
    lg: 24, // 24px
    xl: 32, // 32px
    "2xl": 40,
    "3xl": 48,
  },

  /**
   * Animation durations and easing
   */
  animation: {
    duration: {
      fast: 200,
      normal: 400,
      slow: 500,
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },

  /**
   * Color system: neutral-warm grayscale + status colors only
   */
  colors: {
    // Neutral warm grayscale (primary UI colors)
    neutral: {
      50: "#FAFAF9",
      100: "#F5F5F4",
      200: "#E7E5E4",
      300: "#D6D3D1",
      400: "#A8A29E",
      500: "#78716C",
      600: "#57534E",
      700: "#44403C",
      800: "#292524",
      900: "#1C1917",
    },
    // Color ONLY for status and primary CTAs
    status: {
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    },
    primary: {
      DEFAULT: "#6366F1", // Indigo for CTAs
      hover: "#4F46E5",
    },
  },

  /**
   * Accessibility standards
   */
  interaction: {
    minTouchTarget: 44, // 44×44px minimum for all interactive elements
    minContrastRatio: 3, // 3:1 minimum contrast
    focusRingWidth: 2,
  },

  /**
   * Typography scale
   */
  typography: {
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
} as const;

/**
 * Utility function to get spacing value
 */
export const spacing = (multiplier: keyof typeof DESIGN_TOKENS.spacing) => {
  return `${DESIGN_TOKENS.spacing[multiplier]}px`;
};

/**
 * Utility function to get animation CSS
 */
export const animation = (
  duration: keyof typeof DESIGN_TOKENS.animation.duration = "normal"
) => {
  return {
    transitionDuration: `${DESIGN_TOKENS.animation.duration[duration]}ms`,
    transitionTimingFunction: DESIGN_TOKENS.animation.easing.standard,
  };
};
