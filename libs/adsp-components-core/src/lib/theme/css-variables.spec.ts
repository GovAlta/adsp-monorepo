import { AdspTheme } from './adsp-theme';
import { AdspThemes } from './adsp-themes';
import { toComponentCssVariables, toCssVariables } from './css-variables';

const { standard } = AdspThemes;

describe('toCssVariables', () => {
  test.each([
    ['--adsp-color-surface-card', 'var(--goa-color-surface-card)'],
    ['--adsp-typography-font-family', 'var(--goa-font-family-sans)'],
    ['--adsp-typography-heading-2xs-line-height', 'var(--goa-line-height-2)'],
    ['--adsp-spacing-3xl', 'var(--goa-space-3xl)'],
    ['--adsp-border-radius-round', 'var(--goa-border-radius-round)'],
  ])('exposes %s as %s', (variable, value) => {
    // Act
    const variables = toCssVariables(standard);

    // Assert
    expect(variables).toHaveProperty([variable], value);
  });

  test('excludes the theme name', () => {
    // Act
    const variables = toCssVariables(standard);

    // Assert
    expect(Object.keys(variables)).not.toContain('--adsp-name');
  });

  test('exposes component tokens under --adsp-components-*', () => {
    // Act
    const variables = toCssVariables(standard);

    // Assert
    expect(variables).toHaveProperty(
      ['--adsp-components-button-primary-hover-background'],
      'var(--adsp-color-interactive-hover)',
    );
  });

  test('returns the same object for repeated calls with the same theme', () => {
    // Arrange
    const first = toCssVariables(standard);

    // Act
    const second = toCssVariables(standard);

    // Assert
    expect(second).toBe(first);
  });

  test('reflects the values of a different theme', () => {
    // Arrange
    const darkCardTheme: AdspTheme = {
      ...standard,
      name: 'dark card',
      color: { ...standard.color, surface: { ...standard.color.surface, card: '#1f1f1f' } },
    };

    // Act
    const variables = toCssVariables(darkCardTheme);

    // Assert
    expect(variables).toHaveProperty(['--adsp-color-surface-card'], '#1f1f1f');
  });
});

describe('toComponentCssVariables', () => {
  test('names instance overrides the way toCssVariables names the component section', () => {
    // Act
    const variables = toComponentCssVariables('button', { borderRadius: '0', primary: { background: '#00703c' } });

    // Assert
    expect(variables).toEqual({
      '--adsp-components-button-border-radius': '0',
      '--adsp-components-button-primary-background': '#00703c',
    });
  });
});
