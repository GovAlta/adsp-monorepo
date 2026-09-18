import { AdspTheme } from './AdspTheme';

// Values reference the GoA Design System's CSS custom properties (published by
// @abgov/design-tokens, already loaded by every ADSP application) rather than copying literal
// colour/size values, so the standard theme tracks the design system instead of forking it.
const standard: AdspTheme = {
  name: 'standard',
  color: {
    text: {
      default: 'var(--goa-color-text-default)',
      secondary: 'var(--goa-color-text-secondary)',
      light: 'var(--goa-color-text-light)',
      disabled: 'var(--goa-color-text-disabled)',
    },
    surface: {
      page: 'var(--goa-color-surface-page)',
      card: 'var(--goa-color-surface-card)',
      input: 'var(--goa-color-surface-input)',
      default: 'var(--goa-color-surface-default)',
    },
    interactive: {
      default: 'var(--goa-color-interactive-default)',
      hover: 'var(--goa-color-interactive-hover)',
      focus: 'var(--goa-color-interactive-focus)',
      disabled: 'var(--goa-color-interactive-disabled)',
    },
    status: {
      success: 'var(--goa-color-success-default)',
      info: 'var(--goa-color-info-default)',
      important: 'var(--goa-color-important-default)',
      emergency: 'var(--goa-color-emergency-default)',
    },
  },
  typography: {
    fontFamily: 'var(--goa-font-family-sans)',
    heading: {
      xs: { fontSize: 'var(--goa-typography-heading-xs)', lineHeight: 'var(--goa-line-height-3)' },
      s: { fontSize: 'var(--goa-typography-heading-s)', lineHeight: 'var(--goa-line-height-4)' },
      m: { fontSize: 'var(--goa-typography-heading-m)', lineHeight: 'var(--goa-line-height-5)' },
      l: { fontSize: 'var(--goa-typography-heading-l)', lineHeight: 'var(--goa-line-height-6)' },
      xl: { fontSize: 'var(--goa-typography-heading-xl)', lineHeight: 'var(--goa-line-height-7)' },
    },
    body: {
      xs: { fontSize: 'var(--goa-typography-body-xs)', lineHeight: 'var(--goa-line-height-1)' },
      s: { fontSize: 'var(--goa-typography-body-s)', lineHeight: 'var(--goa-line-height-2)' },
      m: { fontSize: 'var(--goa-typography-body-m)', lineHeight: 'var(--goa-line-height-3)' },
      l: { fontSize: 'var(--goa-typography-body-l)', lineHeight: 'var(--goa-line-height-4)' },
    },
  },
  spacing: {
    '3xs': 'var(--goa-space-3xs)',
    '2xs': 'var(--goa-space-2xs)',
    xs: 'var(--goa-space-xs)',
    s: 'var(--goa-space-s)',
    m: 'var(--goa-space-m)',
    l: 'var(--goa-space-l)',
    xl: 'var(--goa-space-xl)',
    '2xl': 'var(--goa-space-2xl)',
    '3xl': 'var(--goa-space-3xl)',
  },
  borderRadius: {
    none: 'var(--goa-border-radius-none)',
    s: 'var(--goa-border-radius-s)',
    m: 'var(--goa-border-radius-m)',
    l: 'var(--goa-border-radius-l)',
    round: 'var(--goa-border-radius-round)',
  },
  components: {},
};

/**
 * The named themes ADSP provides for application components to select from. Applications choose
 * one of these rather than constructing their own AdspTheme.
 */
export const AdspThemes = {
  standard,
} as const;
