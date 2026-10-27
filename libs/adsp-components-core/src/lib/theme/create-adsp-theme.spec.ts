import { AdspThemes } from './adsp-themes';
import { createAdspTheme, AdspThemeOverrides } from './create-adsp-theme';

const { standard } = AdspThemes;

const greenCalendarEvents: AdspThemeOverrides = {
  components: { calendar: { eventBackground: '#00703c' } },
};

describe('createAdspTheme', () => {
  test('applies an overridden component token', () => {
    // Act
    const theme = createAdspTheme(standard, greenCalendarEvents);

    // Assert
    expect(theme.components.calendar.eventBackground).toBe('#00703c');
  });

  test('keeps the tokens that are not overridden', () => {
    // Act
    const theme = createAdspTheme(standard, greenCalendarEvents);

    // Assert
    expect(theme.components.calendar.eventTextColor).toBe(standard.components.calendar.eventTextColor);
  });

  test('keeps the base theme name when the overrides give none', () => {
    // Act
    const theme = createAdspTheme(standard, greenCalendarEvents);

    // Assert
    expect(theme.name).toBe('standard');
  });

  test('uses the name given in the overrides', () => {
    // Act
    const theme = createAdspTheme(standard, { ...greenCalendarEvents, name: 'green-calendar-events' });

    // Assert
    expect(theme.name).toBe('green-calendar-events');
  });

  test('leaves the base theme unchanged', () => {
    // Act
    createAdspTheme(standard, greenCalendarEvents);

    // Assert
    expect(standard.components.calendar.eventBackground).toBe('var(--adsp-color-interactive-default)');
  });

  test('ignores overrides that are undefined', () => {
    // Act
    const theme = createAdspTheme(standard, { color: { text: { default: undefined } } });

    // Assert
    expect(theme.color.text.default).toBe(standard.color.text.default);
  });

  test('returns a frozen theme', () => {
    // Act
    const theme = createAdspTheme(standard, greenCalendarEvents);

    // Assert
    expect(Object.isFrozen(theme.components.calendar)).toBe(true);
  });
});
