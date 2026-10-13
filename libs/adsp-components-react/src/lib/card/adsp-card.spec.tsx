import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdspCard } from './adsp-card';

describe('AdspCard', () => {
  test('renders the heading', () => {
    // Act
    render(<AdspCard heading="Application review" />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Application review' })).toBeInTheDocument();
  });

  test('renders its content', () => {
    // Act
    render(<AdspCard heading="Application review">Submitted on 2026-10-01</AdspCard>);

    // Assert
    expect(screen.getByText('Submitted on 2026-10-01')).toBeInTheDocument();
  });

  test('applies the current theme to its root element', () => {
    // Arrange
    render(<AdspCard heading="Application review" testId="review-card" />);

    // Act
    const cardColor = screen.getByTestId('review-card').style.getPropertyValue('--adsp-color-surface-card');

    // Assert
    expect(cardColor).toBe('var(--goa-color-surface-card)');
  });

  test('applies instance overrides to its own card token', () => {
    // Arrange
    render(<AdspCard heading="Application review" testId="review-card" themeOverrides={{ background: '#f1f8fd' }} />);

    // Act
    const background = screen.getByTestId('review-card').style.getPropertyValue('--adsp-components-card-background');

    // Assert
    expect(background).toBe('#f1f8fd');
  });
});
