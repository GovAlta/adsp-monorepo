// clean-code-ignore: RULE-19 — type-only contract, no runtime logic to unit test. Exercised via
// ./AdspThemes.spec.ts, which builds AdspTheme values against these interfaces.
// The common theme contract for ADSP application components. This file must not depend on React,
// Angular, Vue or any other UI framework - framework-specific theme infrastructure (context,
// providers, hooks, ...) belongs in the corresponding framework adapter package, e.g.
// adsp-components-react.

export interface AdspThemeColor {
  text: {
    default: string;
    secondary: string;
    light: string;
    disabled: string;
  };
  surface: {
    page: string;
    card: string;
    input: string;
    default: string;
  };
  interactive: {
    default: string;
    hover: string;
    focus: string;
    disabled: string;
  };
  status: {
    success: string;
    info: string;
    important: string;
    emergency: string;
  };
}

export interface AdspThemeTypeStyle {
  fontSize: string;
  lineHeight: string;
}

export interface AdspThemeTypography {
  fontFamily: string;
  heading: {
    xs: AdspThemeTypeStyle;
    s: AdspThemeTypeStyle;
    m: AdspThemeTypeStyle;
    l: AdspThemeTypeStyle;
    xl: AdspThemeTypeStyle;
  };
  body: {
    xs: AdspThemeTypeStyle;
    s: AdspThemeTypeStyle;
    m: AdspThemeTypeStyle;
    l: AdspThemeTypeStyle;
  };
}

export interface AdspThemeSpacing {
  '3xs': string;
  '2xs': string;
  xs: string;
  s: string;
  m: string;
  l: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface AdspThemeBorderRadius {
  none: string;
  s: string;
  m: string;
  l: string;
  round: string;
}

/**
 * The presentation policy shared by all ADSP application components. A theme is not simply a bag
 * of CSS values - it is the set of semantic presentation decisions (colour, typography, spacing,
 * ...) that keep the component family visually consistent and within GoA Design System guidelines.
 *
 * Applications select from themes supplied by ADSP (see AdspThemes); they are not expected to
 * assemble their own AdspTheme values.
 *
 * `components` is the extension point component-specific tickets use to add presentation that
 * cannot be expressed through the common semantic tokens above (e.g. a message renderer for a
 * conversation component). It is intentionally untyped and empty until a component requires it.
 */
export interface AdspTheme {
  name: string;
  color: AdspThemeColor;
  typography: AdspThemeTypography;
  spacing: AdspThemeSpacing;
  borderRadius: AdspThemeBorderRadius;
  components: Record<string, unknown>;
}
