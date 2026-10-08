import { type ReactNode } from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { AdspThemes, type AdspTheme, type AdspThemeOverrides } from '@abgov/adsp-components-core';
import { AdspThemeProvider, useAdspTheme, useAdspThemeStyle } from './adsp-theme-provider';

const { standard } = AdspThemes;

const highContrastTheme: AdspTheme = {
  ...standard,
  name: 'high contrast',
  color: { ...standard.color, text: { ...standard.color.text, default: '#000000' } },
};

const greenPrimaryButtons: AdspThemeOverrides = {
  components: { button: { primary: { background: '#00703c' } } },
};

const withProvider =
  (theme?: AdspTheme) =>
  ({ children }: { children: ReactNode }) => <AdspThemeProvider theme={theme}>{children}</AdspThemeProvider>;

const ThemedBox = () => <div data-testid="themed-box" style={useAdspThemeStyle()} />;

describe('useAdspTheme', () => {
  test('returns the standard theme when no provider is rendered', () => {
    // Act
    const { result } = renderHook(() => useAdspTheme());

    // Assert
    expect(result.current).toBe(standard);
  });

  test('returns the standard theme when the provider is given no theme', () => {
    // Act
    const { result } = renderHook(() => useAdspTheme(), { wrapper: withProvider() });

    // Assert
    expect(result.current).toBe(standard);
  });

  test('returns the theme selected by the provider', () => {
    // Act
    const { result } = renderHook(() => useAdspTheme(), { wrapper: withProvider(highContrastTheme) });

    // Assert
    expect(result.current).toBe(highContrastTheme);
  });

  test('returns the innermost theme when providers are nested', () => {
    // Arrange
    const nestedProviders = ({ children }: { children: ReactNode }) => (
      <AdspThemeProvider theme={standard}>
        <AdspThemeProvider theme={highContrastTheme}>{children}</AdspThemeProvider>
      </AdspThemeProvider>
    );

    // Act
    const { result } = renderHook(() => useAdspTheme(), { wrapper: nestedProviders });

    // Assert
    expect(result.current).toBe(highContrastTheme);
  });

  test('builds on the parent theme when given only overrides', () => {
    // Arrange
    const overridesOnParent = ({ children }: { children: ReactNode }) => (
      <AdspThemeProvider theme={highContrastTheme}>
        <AdspThemeProvider overrides={greenPrimaryButtons}>{children}</AdspThemeProvider>
      </AdspThemeProvider>
    );

    // Act
    const { result } = renderHook(() => useAdspTheme(), { wrapper: overridesOnParent });

    // Assert
    expect(result.current.color.text.default).toBe('#000000');
  });

  test('applies the overrides to the theme in scope', () => {
    // Arrange
    const withOverrides = ({ children }: { children: ReactNode }) => (
      <AdspThemeProvider overrides={greenPrimaryButtons}>{children}</AdspThemeProvider>
    );

    // Act
    const { result } = renderHook(() => useAdspTheme(), { wrapper: withOverrides });

    // Assert
    expect(result.current.components.button.primary.background).toBe('#00703c');
  });
});

describe('useAdspThemeStyle', () => {
  test('returns the selected theme as --adsp-* custom properties', () => {
    // Act
    const { result } = renderHook(() => useAdspThemeStyle(), { wrapper: withProvider(highContrastTheme) });

    // Assert
    expect(result.current).toHaveProperty(['--adsp-color-text-default'], '#000000');
  });

  test('adds instance overrides for the named component', () => {
    // Act
    const { result } = renderHook(() => useAdspThemeStyle('button', { primary: { background: '#00703c' } }));

    // Assert
    expect(result.current).toHaveProperty(['--adsp-components-button-primary-background'], '#00703c');
  });

  test('keeps the theme properties alongside instance overrides', () => {
    // Act
    const { result } = renderHook(() => useAdspThemeStyle('button', { primary: { background: '#00703c' } }));

    // Assert
    expect(result.current).toHaveProperty(['--adsp-color-text-default'], 'var(--goa-color-text-default)');
  });

  test('applies the custom properties to the element it is spread on', () => {
    // Arrange
    render(
      <AdspThemeProvider theme={highContrastTheme}>
        <ThemedBox />
      </AdspThemeProvider>,
    );

    // Act
    const value = screen.getByTestId('themed-box').style.getPropertyValue('--adsp-color-text-default');

    // Assert
    expect(value).toBe('#000000');
  });
});
