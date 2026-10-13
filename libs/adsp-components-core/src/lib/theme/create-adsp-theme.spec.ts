import { AdspThemes } from './adsp-themes';
import { createAdspTheme, AdspThemeOverrides } from './create-adsp-theme';

const { standard } = AdspThemes;

const greenPrimaryButtons: AdspThemeOverrides = {
  components: { button: { primary: { background: '#00703c' } } },
};

describe('createAdspTheme', () => {
  test('applies an overridden component token', () => {
    // Act
    const theme = createAdspTheme(standard, greenPrimaryButtons);

    // Assert
    expect(theme.components.button.primary.background).toBe('#00703c');
  });

  test('keeps the tokens that are not overridden', () => {
    // Act
    const theme = createAdspTheme(standard, greenPrimaryButtons);

    // Assert
    expect(theme.components.button.primary.textColor).toBe(standard.components.button.primary.textColor);
  });

  test('keeps the base theme name when the overrides give none', () => {
    // Act
    const theme = createAdspTheme(standard, greenPrimaryButtons);

    // Assert
    expect(theme.name).toBe('standard');
  });

  test('uses the name given in the overrides', () => {
    // Act
    const theme = createAdspTheme(standard, { ...greenPrimaryButtons, name: 'green-buttons' });

    // Assert
    expect(theme.name).toBe('green-buttons');
  });

  test('leaves the base theme unchanged', () => {
    // Act
    createAdspTheme(standard, greenPrimaryButtons);

    // Assert
    expect(standard.components.button.primary.background).toBe('var(--adsp-color-interactive-default)');
  });

  test('ignores overrides that are undefined', () => {
    // Act
    const theme = createAdspTheme(standard, { color: { text: { default: undefined } } });

    // Assert
    expect(theme.color.text.default).toBe(standard.color.text.default);
  });

  test('returns a frozen theme', () => {
    // Act
    const theme = createAdspTheme(standard, greenPrimaryButtons);

    // Assert
    expect(Object.isFrozen(theme.components.button.primary)).toBe(true);
  });
});
