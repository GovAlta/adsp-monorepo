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

const PRIMARY_BACKGROUND = '--adsp-components-button-primary-background';

const tokenOf = (testId: string, variable: string) => screen.getByTestId(testId).style.getPropertyValue(variable);

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

  test('applies instance overrides to the highlighted card', () => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const background = tokenOf('instance-override-card', '--adsp-components-card-background');

    // Assert
    expect(background).toBe('var(--adsp-color-surface-default)');
  });

  test.each([
    ['the Approved badge', 'Approved', '--adsp-components-badge-border-radius', '0'],
    ['Approve', 'Approve', PRIMARY_BACKGROUND, '#6a1b9a'],
    ['Request changes', 'Request changes', '--adsp-components-button-border-radius', 'var(--adsp-border-radius-round)'],
  ])('applies component-level overrides to %s', (_component, text, variable, expected) => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const element = within(screen.getByTestId('instance-override-card')).getByText(text);

    // Assert
    expect(element.style.getPropertyValue(variable)).toBe(expected);
  });

  test.each([
    ['the In review badge', 'In review', '--adsp-components-badge-border-radius', 'var(--adsp-border-radius-round)'],
    ['Withdraw', 'Withdraw', PRIMARY_BACKGROUND, 'var(--adsp-color-interactive-default)'],
  ])('leaves %s without overrides on the theme', (_component, text, variable, expected) => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const element = within(screen.getByTestId('instance-override-card')).getByText(text);

    // Assert
    expect(element.style.getPropertyValue(variable)).toBe(expected);
  });

  test.each([
    ['theme', 'precedence-theme-button', 'var(--adsp-color-interactive-default)'],
    ['section', 'precedence-section-button', 'var(--adsp-color-status-success)'],
    ['component', 'precedence-component-button', '#6a1b9a'],
  ])('takes the primary background from the %s level for %s', (_level, testId, expected) => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const background = tokenOf(testId, PRIMARY_BACKGROUND);

    // Assert
    expect(background).toBe(expected);
  });

  test('passes the section value through tokens the component does not override', () => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const background = tokenOf('precedence-shape-button', PRIMARY_BACKGROUND);

    // Assert
    expect(background).toBe('var(--adsp-color-status-success)');
  });

  test('applies the token the component does override', () => {
    // Arrange
    render(<AdspThemingExample />);

    // Act
    const radius = tokenOf('precedence-shape-button', '--adsp-components-button-border-radius');

    // Assert
    expect(radius).toBe('var(--adsp-border-radius-round)');
  });

  test('lets the theme-level button follow a theme change', () => {
    // Arrange
    const { container } = render(<AdspThemingExample />);

    // Act
    selectTheme(container, 'high-contrast-demo');

    // Assert
    expect(tokenOf('precedence-theme-button', PRIMARY_BACKGROUND)).toBe('#ffd600');
  });

  test.each([
    ['section', 'precedence-section-button', 'var(--adsp-color-status-success)'],
    ['component', 'precedence-component-button', '#6a1b9a'],
  ])('keeps the %s-level override when the theme changes', (_level, testId, expected) => {
    // Arrange
    const { container } = render(<AdspThemingExample />);

    // Act
    selectTheme(container, 'high-contrast-demo');

    // Assert
    expect(tokenOf(testId, PRIMARY_BACKGROUND)).toBe(expected);
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
