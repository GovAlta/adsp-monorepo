import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdspThemingExample } from './AdspThemingExample';

const selectTheme = (container: HTMLElement, value: string) =>
  fireEvent(
    container.querySelector('goa-radio-group[testid="adsp-theme-selector"]') as Element,
    new CustomEvent('_change', { detail: { name: 'adsp-theme', value } }),
  );

const valueUsedBy = (level: string) =>
  screen.getByText(level, { selector: 'td' }).closest('tr')?.querySelector('code')?.textContent;

describe('AdspThemingExample', () => {
  test('takes the theme-level event background from the standard theme initially', () => {
    // Act
    render(<AdspThemingExample />);

    // Assert
    expect(valueUsedBy('Theme')).toBe('var(--adsp-color-interactive-default)');
  });

  test('lets the theme row follow a theme change', () => {
    // Arrange
    const { container } = render(<AdspThemingExample />);

    // Act
    selectTheme(container, 'high-contrast-demo');

    // Assert
    expect(valueUsedBy('Theme')).toBe('#ffd600');
  });

  test.each([
    ['Section', 'var(--adsp-color-status-success)'],
    ['Component', '#6a1b9a'],
  ])('keeps the %s row when the theme changes', (level, expected) => {
    // Arrange
    const { container } = render(<AdspThemingExample />);

    // Act
    selectTheme(container, 'high-contrast-demo');

    // Assert
    expect(valueUsedBy(level)).toBe(expected);
  });

  test('leaves the GoA container without theme properties', () => {
    // Arrange
    const { container } = render(<AdspThemingExample />);

    // Act
    const goaContainer = container.querySelector('goa-container[testid="adsp-theming-container"]') as HTMLElement;

    // Assert
    expect(goaContainer.style.getPropertyValue('--adsp-color-surface-card')).toBe('');
  });

  test('lists the CSS custom properties of the selected theme', () => {
    // Arrange
    const { container } = render(<AdspThemingExample />);

    // Act
    selectTheme(container, 'high-contrast-demo');

    // Assert
    expect(screen.getByTestId('selected-theme-css-variables')).toHaveTextContent('--adsp-color-surface-card: #000000;');
  });
});
