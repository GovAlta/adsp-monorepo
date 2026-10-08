import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdspThemingExample } from './AdspThemingExample';

const selectTheme = (container: HTMLElement, value: string) =>
  fireEvent(
    container.querySelector('goa-radio-group[testid="adsp-theme-selector"]'),
    new CustomEvent('_change', { detail: { name: 'adsp-theme', value } }),
  );

const cardColorOf = (testId: string) => screen.getByTestId(testId).style.getPropertyValue('--adsp-color-surface-card');

const approveButtonIn = (testId: string) => within(screen.getByTestId(testId)).getByRole('button', { name: 'Approve' });

describe('AdspThemingExample', () => {
  test('turns primary buttons green inside the section provider', () => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const background = approveButtonIn('section-override-card').style.getPropertyValue(
      '--adsp-components-button-primary-background',
    );

    // Assert
    expect(background).toBe('var(--adsp-color-status-success)');
  });

  test('leaves primary buttons outside the section provider on the theme', () => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const background = approveButtonIn('selected-theme-card').style.getPropertyValue(
      '--adsp-components-button-primary-background',
    );

    // Assert
    expect(background).toBe('var(--adsp-color-interactive-default)');
  });

  test('builds the section overrides on the selected theme', () => {
    // Arrange
    const { container } = render(<AdspThemingExample />);

    // Act
    selectTheme(container, 'high-contrast-demo');

    // Assert
    expect(cardColorOf('section-override-card')).toBe('#000000');
  });

  test('rounds only the button given instance overrides', () => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const radius = screen.getByTestId('pill-button').style.getPropertyValue('--adsp-components-button-border-radius');

    // Assert
    expect(radius).toBe('var(--adsp-border-radius-round)');
  });

  test('keeps sibling buttons on the theme radius', () => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const radius = screen
      .getByTestId('regular-button')
      .style.getPropertyValue('--adsp-components-button-border-radius');

    // Assert
    expect(radius).toBe('var(--adsp-border-radius-m)');
  });
  test('styles the components inside the provider with the standard theme initially', () => {
    // Act
    render(<AdspThemingExample />);

    // Assert
    expect(cardColorOf('selected-theme-card')).toBe('var(--goa-color-surface-card)');
  });

  test('restyles the components inside the provider when another theme is selected', () => {
    // Arrange
    const { container } = render(<AdspThemingExample />);

    // Act
    selectTheme(container, 'high-contrast-demo');

    // Assert
    expect(cardColorOf('selected-theme-card')).toBe('#000000');
  });

  test('keeps the standard theme for components outside the provider', () => {
    // Arrange
    const { container } = render(<AdspThemingExample />);

    // Act
    selectTheme(container, 'high-contrast-demo');

    // Assert
    expect(cardColorOf('default-theme-card')).toBe('var(--goa-color-surface-card)');
  });

  test('leaves the GoA container outside ADSP components without theme properties', () => {
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
