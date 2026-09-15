/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
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
        gold: {
          50: '#FFF9E6',
          100: '#FEF3C7',
          200: '#F8E287', // Tone 90 (Tertiary Container)
          300: '#F3D24F',
          400: '#E5BA1A',
          500: '#CA9F0A',
          600: '#6D5E0F', // Tone 40 (M3 Tertiary Accent)
          700: '#534706',
          800: '#3A3102',
          900: '#221B00',
          DEFAULT: '#6D5E0F',
        },
        // Official Google Material Design 3 (M3) Semantic Design Tokens
        m3: {
          // Primary (Executive Midnight Charcoal - Luxury Chauffeur & Modern CTAs)
          primary: '#1E252D', // Tone 40 (Guaranteed WCAG AAA 12.5:1 Contrast on White)
          'on-primary': '#FFFFFF',
          'primary-container': '#E2E5EA', // Tone 90 (Soft Executive Light Slate container)
          'on-primary-container': '#101418', // Tone 10 (Deep Charcoal on container)
          'primary-fixed': '#E2E5EA',
          'primary-fixed-dim': '#C6CAD0',
          'on-primary-fixed': '#101418',
          // Secondary (Harmonized Slate Steel Charcoal)
          secondary: '#475467', // Tone 40
          'on-secondary': '#FFFFFF',
          'secondary-container': '#EAECF0', // Tone 90
          'on-secondary-container': '#1D2939', // Tone 10
          // Tertiary (Warm Golden Amber Accent for Ratings & Milestones)
          tertiary: '#6D5E0F', // Tone 40
          'on-tertiary': '#FFFFFF',
          'tertiary-container': '#F8E287', // Tone 90
          'on-tertiary-container': '#221B00', // Tone 10
          // Error
          error: '#BA1A1A',
          'on-error': '#FFFFFF',
          'error-container': '#FFDAD6',
          'on-error-container': '#410002',
          // M3 Authentic Tonal Surface Hierarchy (Clean, Calm, Anti-Glare)
          surface: '#F9FAFB', // Tone 98 (Soft clean canvas)
          'surface-dim': '#E5E7EB', // Tone 87
          'surface-bright': '#FFFFFF', // Tone 100
          'surface-container-lowest': '#FFFFFF', // Tone 100 (Elevated cards & sheets)
          'surface-container-low': '#F3F4F6', // Tone 96 (Subtle section alternating)
          'surface-container': '#ECEEF1', // Tone 94 (Input fields & search canvas)
          'surface-container-high': '#E5E7EB', // Tone 92 (Active navigation indicators & chips)
          'surface-container-highest': '#D1D5DB', // Tone 90 (Dividers & inactive outlines)
          'on-surface': '#111827', // Tone 10 (Deep Charcoal for rates, fares, and headings)
          'on-surface-variant': '#4B5563', // Tone 30 (Secondary body text & icons)
          'outline': '#9CA3AF', // Tone 50 (Borders & field outlines)
          'outline-variant': '#E5E7EB', // Tone 80 (Subtle dividers & card strokes)
          'inverse-surface': '#1F2937', // Tone 20 (Dark tooltips & inverse snackbars)
          'inverse-on-surface': '#F9FAFB', // Tone 95
          'inverse-primary': '#9CA3AF', // Tone 80
          scrim: '#000000',
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
  plugins: [],
};
