import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdspTheme, AdspThemes } from '@core-services/adsp-components-core';
import { AdspThemeProvider, useAdspTheme } from './AdspThemeProvider';

const ThemedProbe: React.FC = () => {
  const theme = useAdspTheme();
  return <span data-testid="theme-name">{theme.name}</span>;
};

describe('AdspThemeProvider', () => {
  it('provides AdspThemes.standard when a component is rendered without a provider', () => {
    render(<ThemedProbe />);
    expect(screen.getByTestId('theme-name').textContent).toBe(AdspThemes.standard.name);
  });

  it('provides AdspThemes.standard when the provider is mounted without an explicit theme', () => {
    render(
      <AdspThemeProvider>
        <ThemedProbe />
      </AdspThemeProvider>
    );
    expect(screen.getByTestId('theme-name').textContent).toBe(AdspThemes.standard.name);
  });

  it('provides the selected theme to descendant components', () => {
    const custom: AdspTheme = { ...AdspThemes.standard, name: 'custom' };
    render(
      <AdspThemeProvider theme={custom}>
        <ThemedProbe />
      </AdspThemeProvider>
    );
    expect(screen.getByTestId('theme-name').textContent).toBe('custom');
  });
});
