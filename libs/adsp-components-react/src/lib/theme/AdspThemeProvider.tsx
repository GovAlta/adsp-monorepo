import React, { createContext, useContext } from 'react';
import { AdspTheme, AdspThemes } from '@core-services/adsp-components-core';

// Default context value is the standard theme itself (not undefined/null), so that
// useAdspTheme() works correctly for any component rendered without an AdspThemeProvider
// ancestor - "an application that does not explicitly choose a theme receives the standard
// theme".
const AdspThemeContext = createContext<AdspTheme>(AdspThemes.standard);

export interface AdspThemeProviderProps {
  theme?: AdspTheme;
  children?: React.ReactNode;
}

/**
 * Establishes the ADSP theme for the application components rendered beneath it. Applications
 * select from AdspThemes rather than assembling their own AdspTheme value:
 *
 *   <AdspThemeProvider theme={AdspThemes.standard}>
 *     <App />
 *   </AdspThemeProvider>
 *
 * Normally mounted once, at application level.
 */
export const AdspThemeProvider: React.FC<AdspThemeProviderProps> = ({ theme = AdspThemes.standard, children }) => (
  <AdspThemeContext.Provider value={theme}>{children}</AdspThemeContext.Provider>
);

/** Obtains the current AdspTheme without it having to be passed down to each component. */
export const useAdspTheme = (): AdspTheme => useContext(AdspThemeContext);
