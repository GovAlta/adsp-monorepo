import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react';
import {
  AdspThemes,
  createAdspTheme,
  toComponentCssVariables,
  toCssVariables,
  type AdspComponentThemeOverrides,
  type AdspTheme,
  type AdspThemeComponents,
  type AdspThemeOverrides,
} from '@abgov/adsp-components-core';

const AdspThemeContext = createContext<AdspTheme>(AdspThemes.standard);
AdspThemeContext.displayName = 'AdspThemeContext';

export interface AdspThemeProviderProps {
  theme?: AdspTheme;
  overrides?: AdspThemeOverrides;
  children?: ReactNode;
}

// Without `theme`, the provider builds on the theme above it (AdspThemes.standard at the top level).
export function AdspThemeProvider({ theme, overrides, children }: AdspThemeProviderProps) {
  const inheritedTheme = useContext(AdspThemeContext);
  const baseTheme = theme ?? inheritedTheme;
  const selectedTheme = useMemo(
    () => (overrides ? createAdspTheme(baseTheme, overrides) : baseTheme),
    [baseTheme, overrides],
  );

  return <AdspThemeContext.Provider value={selectedTheme}>{children}</AdspThemeContext.Provider>;
}

export function useAdspTheme(): AdspTheme {
  return useContext(AdspThemeContext);
}

// Spread on a component's root element; instance overrides apply to that component only.
export function useAdspThemeStyle<K extends keyof AdspThemeComponents>(
  component?: K,
  overrides?: AdspComponentThemeOverrides<K>,
): CSSProperties {
  const themeVariables = toCssVariables(useAdspTheme());

  return useMemo(
    () =>
      (component && overrides
        ? { ...themeVariables, ...toComponentCssVariables(component, overrides) }
        : themeVariables) as CSSProperties,
    [themeVariables, component, overrides],
  );
}
