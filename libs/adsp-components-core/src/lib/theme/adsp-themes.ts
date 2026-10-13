import { AdspTheme } from './adsp-theme';
import { deepFreeze } from './deep-freeze';
import { defaultBadgeTheme } from '../components/badge';
import { defaultButtonTheme } from '../components/button';
import { defaultCardTheme } from '../components/card';

// Values reference GoA design token custom properties so the theme tracks the design system, dark theme included.
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
      default: 'var(--goa-color-surface-default)',
      card: 'var(--goa-color-surface-card)',
      input: 'var(--goa-color-surface-input)',
    },
    border: {
      default: 'var(--goa-color-greyscale-200)',
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
    // Split from the --goa-typography-* `font` shorthands, which are invalid as individual property values.
    heading: {
      '2xs': {
        fontSize: 'var(--goa-font-size-3)',
        fontWeight: 'var(--goa-font-weight-semi-bold)',
        lineHeight: 'var(--goa-line-height-2)',
      },
      xs: {
        fontSize: 'var(--goa-font-size-5)',
        fontWeight: 'var(--goa-font-weight-semi-bold)',
        lineHeight: 'var(--goa-line-height-3)',
      },
      s: {
        fontSize: 'var(--goa-font-size-6)',
        fontWeight: 'var(--goa-font-weight-semi-bold)',
        lineHeight: 'var(--goa-line-height-4)',
      },
      m: {
        fontSize: 'var(--goa-font-size-7)',
        fontWeight: 'var(--goa-font-weight-bold)',
        lineHeight: 'var(--goa-line-height-5)',
      },
      l: {
        fontSize: 'var(--goa-font-size-8)',
        fontWeight: 'var(--goa-font-weight-bold)',
        lineHeight: 'var(--goa-line-height-6)',
      },
      xl: {
        fontSize: 'var(--goa-font-size-9)',
        fontWeight: 'var(--goa-font-weight-bold)',
        lineHeight: 'var(--goa-line-height-7)',
      },
      '2xl': {
        fontSize: 'var(--goa-font-size-10)',
        fontWeight: 'var(--goa-font-weight-bold)',
        lineHeight: 'var(--goa-line-height-8)',
      },
    },
    body: {
      xs: {
        fontSize: 'var(--goa-font-size-2)',
        fontWeight: 'var(--goa-font-weight-regular)',
        lineHeight: 'var(--goa-line-height-1)',
      },
      s: {
        fontSize: 'var(--goa-font-size-3)',
        fontWeight: 'var(--goa-font-weight-regular)',
        lineHeight: 'var(--goa-line-height-2)',
      },
      m: {
        fontSize: 'var(--goa-font-size-4)',
        fontWeight: 'var(--goa-font-weight-regular)',
        lineHeight: 'var(--goa-line-height-3)',
      },
      l: {
        fontSize: 'var(--goa-font-size-6)',
        fontWeight: 'var(--goa-font-weight-regular)',
        lineHeight: 'var(--goa-line-height-5)',
      },
    },
  },
  spacing: {
    none: 'var(--goa-space-none)',
    '3xs': 'var(--goa-space-3xs)',
    '2xs': 'var(--goa-space-2xs)',
    xs: 'var(--goa-space-xs)',
    s: 'var(--goa-space-s)',
    m: 'var(--goa-space-m)',
    l: 'var(--goa-space-l)',
    xl: 'var(--goa-space-xl)',
    '2xl': 'var(--goa-space-2xl)',
    '3xl': 'var(--goa-space-3xl)',
    '4xl': 'var(--goa-space-4xl)',
  },
  borderRadius: {
    none: 'var(--goa-border-radius-none)',
    xs: 'var(--goa-border-radius-xs)',
    s: 'var(--goa-border-radius-s)',
    m: 'var(--goa-border-radius-m)',
    l: 'var(--goa-border-radius-l)',
    xl: 'var(--goa-border-radius-xl)',
    '2xl': 'var(--goa-border-radius-2xl)',
    '3xl': 'var(--goa-border-radius-3xl)',
    round: 'var(--goa-border-radius-round)',
  },
  // Component tokens alias the base --adsp-* roles, so changing a base role restyles every component using it.
  components: {
    badge: defaultBadgeTheme,
    button: defaultButtonTheme,
    card: defaultCardTheme,
  },
};

// Frozen because every application shares these instances.
export const AdspThemes = deepFreeze({ standard });
