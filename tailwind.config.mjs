/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // 100% Google Material Design 3 (M3) Option A: Executive Midnight Charcoal & Onyx Palette
        // Signature Logo "K" Red preserved strictly as brand accent
        'logo-red': {
          DEFAULT: '#EC221F',
          50: '#FFF8F7',
          500: '#EC221F',
          600: '#DC2626',
        },
        crimson: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E2E5EA', // Primary Container
          300: '#C6CAD0',
          400: '#6B7280',
          500: '#374151',
          600: '#1E252D', // Tone 40 (Executive Midnight Charcoal Primary)
          700: '#111827', // Tone 30 (Midnight Hover Tone)
          800: '#0B0F13',
          900: '#050709',
          950: '#000000',
          DEFAULT: '#1E252D',
        },
        ruby: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E2E5EA',
          300: '#C6CAD0',
          400: '#6B7280',
          500: '#374151',
          600: '#1E252D',
          700: '#111827',
          800: '#0B0F13',
          900: '#050709',
          DEFAULT: '#1E252D',
        },
        onyx: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#111827', // Tone 10 (On-Surface Primary Text & Rates)
          900: '#0B0F13',
          950: '#000000',
          DEFAULT: '#111827',
        },
        // Saffron / temple-gold tertiary tonal palette (M3 HCT tones)
        gold: {
          50: '#FFF8F4',
          100: '#FFEEE1',
          200: '#FFDCBE', // Tone 90 (Tertiary Container)
          300: '#FFB870', // Tone 80 (Tertiary Fixed Dim - stars/icons only)
          400: '#E09530', // Tone 70
          500: '#B06A00', // Tone 50
          600: '#8B5000', // Tone 40 (M3 Tertiary)
          700: '#6A3C00', // Tone 30
          800: '#4A2800', // Tone 20
          900: '#2C1600', // Tone 10
          DEFAULT: '#8B5000',
        },
        // Official Google Material Design 3 (M3) Semantic Design Tokens
        // Fully synchronized with CSS variables for Light & Dark Theme dynamic switching
        m3: {
          // Primary (Executive Midnight Charcoal - Tone 40)
          primary: 'rgb(var(--md-sys-color-primary-rgb) / <alpha-value>)',
          'on-primary': 'rgb(var(--md-sys-color-on-primary-rgb) / <alpha-value>)',
          'primary-container': 'rgb(var(--md-sys-color-primary-container-rgb) / <alpha-value>)',
          'on-primary-container': 'rgb(var(--md-sys-color-on-primary-container-rgb) / <alpha-value>)',
          'primary-fixed': 'rgb(var(--md-sys-color-primary-fixed-rgb) / <alpha-value>)',
          'primary-fixed-dim': 'rgb(var(--md-sys-color-primary-fixed-dim-rgb) / <alpha-value>)',
          'on-primary-fixed': 'rgb(var(--md-sys-color-on-primary-fixed-rgb) / <alpha-value>)',
          'on-primary-fixed-variant': 'rgb(var(--md-sys-color-on-primary-fixed-variant-rgb) / <alpha-value>)',

          // Secondary (Harmonized Slate Steel Charcoal - Tone 40)
          secondary: 'rgb(var(--md-sys-color-secondary-rgb) / <alpha-value>)',
          'on-secondary': 'rgb(var(--md-sys-color-on-secondary-rgb) / <alpha-value>)',
          'secondary-container': 'rgb(var(--md-sys-color-secondary-container-rgb) / <alpha-value>)',
          'on-secondary-container': 'rgb(var(--md-sys-color-on-secondary-container-rgb) / <alpha-value>)',
          'secondary-fixed': 'rgb(var(--md-sys-color-secondary-fixed-rgb) / <alpha-value>)',
          'secondary-fixed-dim': 'rgb(var(--md-sys-color-secondary-fixed-dim-rgb) / <alpha-value>)',
          'on-secondary-fixed': 'rgb(var(--md-sys-color-on-secondary-fixed-rgb) / <alpha-value>)',
          'on-secondary-fixed-variant': 'rgb(var(--md-sys-color-on-secondary-fixed-variant-rgb) / <alpha-value>)',

          // Tertiary (Saffron / Temple Golden Amber - Tone 40)
          tertiary: 'rgb(var(--md-sys-color-tertiary-rgb) / <alpha-value>)',
          'on-tertiary': 'rgb(var(--md-sys-color-on-tertiary-rgb) / <alpha-value>)',
          'tertiary-container': 'rgb(var(--md-sys-color-tertiary-container-rgb) / <alpha-value>)',
          'on-tertiary-container': 'rgb(var(--md-sys-color-on-tertiary-container-rgb) / <alpha-value>)',
          'tertiary-fixed': 'rgb(var(--md-sys-color-tertiary-fixed-rgb) / <alpha-value>)',
          'tertiary-fixed-dim': 'rgb(var(--md-sys-color-tertiary-fixed-dim-rgb) / <alpha-value>)',
          'on-tertiary-fixed': 'rgb(var(--md-sys-color-on-tertiary-fixed-rgb) / <alpha-value>)',
          'on-tertiary-fixed-variant': 'rgb(var(--md-sys-color-on-tertiary-fixed-variant-rgb) / <alpha-value>)',

          // Success (M3 Custom Harmonized Semantic Color)
          success: 'rgb(var(--md-sys-color-success-rgb) / <alpha-value>)',
          'on-success': 'rgb(var(--md-sys-color-on-success-rgb) / <alpha-value>)',
          'success-container': 'rgb(var(--md-sys-color-success-container-rgb) / <alpha-value>)',
          'on-success-container': 'rgb(var(--md-sys-color-on-success-container-rgb) / <alpha-value>)',

          // Error
          error: 'rgb(var(--md-sys-color-error-rgb) / <alpha-value>)',
          'on-error': 'rgb(var(--md-sys-color-on-error-rgb) / <alpha-value>)',
          'error-container': 'rgb(var(--md-sys-color-error-container-rgb) / <alpha-value>)',
          'on-error-container': 'rgb(var(--md-sys-color-on-error-container-rgb) / <alpha-value>)',

          // Authentic Google M3 Clean Anti-Glare Surface Hierarchy
          surface: 'rgb(var(--md-sys-color-surface-rgb) / <alpha-value>)',
          'surface-dim': 'rgb(var(--md-sys-color-surface-dim-rgb) / <alpha-value>)',
          'surface-bright': 'rgb(var(--md-sys-color-surface-bright-rgb) / <alpha-value>)',
          'surface-container-lowest': 'rgb(var(--md-sys-color-surface-container-lowest-rgb) / <alpha-value>)',
          'surface-container-low': 'rgb(var(--md-sys-color-surface-container-low-rgb) / <alpha-value>)',
          'surface-container': 'rgb(var(--md-sys-color-surface-container-rgb) / <alpha-value>)',
          'surface-container-high': 'rgb(var(--md-sys-color-surface-container-high-rgb) / <alpha-value>)',
          'surface-container-highest': 'rgb(var(--md-sys-color-surface-container-highest-rgb) / <alpha-value>)',

          // Text, Outlines, Inverse & Tint
          'on-surface': 'rgb(var(--md-sys-color-on-surface-rgb) / <alpha-value>)',
          'on-surface-variant': 'rgb(var(--md-sys-color-on-surface-variant-rgb) / <alpha-value>)',
          outline: 'rgb(var(--md-sys-color-outline-rgb) / <alpha-value>)',
          'outline-variant': 'rgb(var(--md-sys-color-outline-variant-rgb) / <alpha-value>)',
          'inverse-surface': 'rgb(var(--md-sys-color-inverse-surface-rgb) / <alpha-value>)',
          'inverse-on-surface': 'rgb(var(--md-sys-color-inverse-on-surface-rgb) / <alpha-value>)',
          'inverse-primary': 'rgb(var(--md-sys-color-inverse-primary-rgb) / <alpha-value>)',
          'surface-tint': 'rgb(var(--md-sys-color-surface-tint-rgb) / <alpha-value>)',
          scrim: 'rgb(var(--md-sys-color-scrim-rgb) / <alpha-value>)',
          shadow: 'rgb(var(--md-sys-color-shadow-rgb) / <alpha-value>)',
        },
        brand: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E2E5EA',
          300: '#C6CAD0',
          400: '#6B7280',
          500: '#374151',
          600: '#1E252D',
          700: '#111827',
          800: '#0B0F13',
          900: '#050709',
          DEFAULT: '#1E252D',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          hover: '#20BD5A',
          dark: '#1EBE5D',
          deep: '#128C7E',
          surface: '#E8F8EF',
        },
      },
      fontSize: {
        'micro': ['10px', { lineHeight: '14px', fontWeight: '600' }],
        'badge': ['11px', { lineHeight: '16px', fontWeight: '700' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        // Google Material 3 (M3) Official Typescale Tokens
        'm3-display-l': ['57px', { lineHeight: '64px', letterSpacing: '-0.25px', fontWeight: '400' }],
        'm3-display-m': ['45px', { lineHeight: '52px', letterSpacing: '0', fontWeight: '400' }],
        'm3-display-s': ['36px', { lineHeight: '44px', letterSpacing: '0', fontWeight: '400' }],
        'm3-headline-l': ['32px', { lineHeight: '40px', letterSpacing: '0', fontWeight: '400' }],
        'm3-headline-m': ['28px', { lineHeight: '36px', letterSpacing: '0', fontWeight: '400' }],
        'm3-headline-s': ['24px', { lineHeight: '32px', letterSpacing: '0', fontWeight: '400' }],
        'm3-title-l': ['22px', { lineHeight: '28px', letterSpacing: '0', fontWeight: '400' }],
        'm3-title-m': ['16px', { lineHeight: '24px', letterSpacing: '0.15px', fontWeight: '500' }],
        'm3-title-s': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'm3-body-l': ['16px', { lineHeight: '24px', letterSpacing: '0.5px', fontWeight: '400' }],
        'm3-body-m': ['14px', { lineHeight: '20px', letterSpacing: '0.25px', fontWeight: '400' }],
        'm3-body-s': ['12px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '400' }],
        'm3-label-l': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'm3-label-m': ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'm3-label-s': ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
        'tamil-body': ['"Noto Sans Tamil"', 'sans-serif'],
        'tamil-heading': ['"Noto Sans Tamil"', 'sans-serif'],
      },
      borderRadius: {
        'm3-none': '0px',
        'm3-xs': '4px',
        'm3-sm': '8px',
        'm3-md': '12px',
        'm3-lg': '16px',
        'm3-xl': '24px',
        'm3-2xl': '28px',
        'm3-full': '9999px',
      },
      boxShadow: {
        'm3-0': 'none',
        'm3-1': '0px 1px 3px 1px rgba(15, 23, 42, 0.08), 0px 1px 2px 0px rgba(15, 23, 42, 0.05)',
        'm3-2': '0px 2px 6px 2px rgba(15, 23, 42, 0.08), 0px 1px 2px 0px rgba(15, 23, 42, 0.05)',
        'm3-3': '0px 4px 8px 3px rgba(15, 23, 42, 0.08), 0px 1px 3px 0px rgba(15, 23, 42, 0.05)',
        'm3-4': '0px 6px 10px 4px rgba(15, 23, 42, 0.09), 0px 2px 3px 0px rgba(15, 23, 42, 0.05)',
        'm3-5': '0px 8px 12px 6px rgba(15, 23, 42, 0.12), 0px 4px 4px 0px rgba(15, 23, 42, 0.05)',
        'luxe-1': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'luxe-2': '0 4px 12px -1px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        'luxe-3': '0 12px 28px -4px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.05)',
        'crimson-glow': '0 0 30px -5px rgba(220, 38, 38, 0.3)',
        'ruby-glow': '0 0 30px -5px rgba(185, 28, 28, 0.25)',
        'gold-glow': '0 0 30px -5px rgba(217, 119, 6, 0.25)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      });
    },
  ],
};
