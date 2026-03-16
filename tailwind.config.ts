import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand:         'var(--color-brand)',
        'brand-hover': 'var(--color-brand-hover)',
        'brand-muted': 'var(--color-brand-muted)',
        'brand-text':  'var(--color-brand-text)',
        accent:        'var(--color-accent)',

        bg:            'var(--color-bg)',
        surface:       'var(--color-surface)',
        'surface-2':   'var(--color-surface-2)',

        fg:            'var(--color-fg)',
        'fg-muted':    'var(--color-fg-muted)',
        'fg-subtle':   'var(--color-fg-subtle)',

        border:        'var(--color-border)',
        'border-focus':'var(--color-border-focus)',

        success:       'var(--color-success)',
        'success-muted':'var(--color-success-muted)',
        'success-text':'var(--color-success-text)',

        warning:       'var(--color-warning)',
        'warning-muted':'var(--color-warning-muted)',
        'warning-text':'var(--color-warning-text)',

        error:         'var(--color-error)',
        'error-muted': 'var(--color-error-muted)',
        'error-text':  'var(--color-error-text)',
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      letterSpacing: {
        snug: '-0.03125em',
        tight: '-0.01875em',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
      },
      ringColor: {
        DEFAULT: 'var(--color-brand)',
      },
    },
  },
  plugins: [],
}

export default config
