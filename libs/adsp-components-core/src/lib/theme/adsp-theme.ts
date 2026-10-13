import type { AdspBadgeTheme } from '../components/badge';
import type { AdspButtonTheme } from '../components/button';
import type { AdspCardTheme } from '../components/card';

export interface AdspThemeColor {
  text: { default: string; secondary: string; light: string; disabled: string };
  surface: { page: string; default: string; card: string; input: string };
  border: { default: string };
  interactive: { default: string; hover: string; focus: string; disabled: string };
  status: { success: string; info: string; important: string; emergency: string };
}

export interface AdspThemeTypeStyle {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
}

export interface AdspThemeTypography {
  fontFamily: string;
  heading: Record<'2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl', AdspThemeTypeStyle>;
  body: Record<'xs' | 's' | 'm' | 'l', AdspThemeTypeStyle>;
}

export type AdspThemeSpacing = Record<
  'none' | '3xs' | '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl' | '3xl' | '4xl',
  string
>;

export type AdspThemeBorderRadius = Record<'none' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl' | '3xl' | 'round', string>;

// Component-level tokens. A new component adds its section here and supplies it in every theme in AdspThemes.
export interface AdspThemeComponents {
  badge: AdspBadgeTheme;
  button: AdspButtonTheme;
  card: AdspCardTheme;
}

// A theme controls presentation, never behaviour. Start from AdspThemes; adjust with createAdspTheme.
export interface AdspTheme {
  name: string;
  color: AdspThemeColor;
  typography: AdspThemeTypography;
  spacing: AdspThemeSpacing;
  borderRadius: AdspThemeBorderRadius;
  components: AdspThemeComponents;
}
