const plugin = require('tailwindcss/plugin')
const animate = require('tailwindcss-animate')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--color-background)',
                foreground: 'var(--color-foreground)',
                card: 'var(--color-card)',
                'card-foreground': 'var(--color-card-foreground)',
                popover: 'var(--color-popover)',
                'popover-foreground': 'var(--color-popover-foreground)',
                primary: 'var(--color-primary)',
                'primary-foreground': 'var(--color-primary-foreground)',
                secondary: 'var(--color-secondary)',
                muted: 'var(--color-muted)',
                'muted-foreground': 'var(--color-muted-foreground)',
                accent: 'var(--color-accent)',
                'accent-foreground': 'var(--color-accent-foreground)',
                destructive: 'var(--color-destructive)',
                border: 'var(--color-border)',
                input: 'var(--color-input)',
                ring: 'var(--color-ring)',
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                risk: 'var(--color-risk)',
            },
        },
    },
    plugins: [
        animate,
        plugin(function ({ addUtilities, addComponents }) {
            addUtilities(
                {
                    '.transition-smooth': {
                        transitionProperty: 'all',
                        transitionTimingFunction: 'ease-out',
                        transitionDuration: '200ms',
                    },
                    '.transition-micro': {
                        transitionProperty: 'all',
                        transitionTimingFunction: 'ease-out',
                        transitionDuration: '150ms',
                    },
                    '.focus-ring': {
                        outline: 'none',
                    },
                },
                { variants: ['responsive', 'hover', 'focus', 'active'] }
            )

            addComponents({
                '.interactive': {
                    transitionProperty: 'all',
                    transitionTimingFunction: 'ease-out',
                    transitionDuration: '200ms',
                },
                '.interactive:hover': {
                    backgroundColor: 'var(--color-accent)',
                },
                '.interactive:active': {
                    transform: 'scale(0.98)'
                },
                '.interactive-ring': {
                    transitionProperty: 'all',
                    transitionTimingFunction: 'ease-out',
                    transitionDuration: '200ms',
                },
                '.interactive-ring:focus-visible': {
                    boxShadow: '0 0 0 2px var(--color-ring)',
                },
                '.data-row-interactive': {
                    transitionProperty: 'all',
                    transitionTimingFunction: 'ease-out',
                    transitionDuration: '200ms',
                    cursor: 'pointer',
                },
            })
        }),
    ],
}
