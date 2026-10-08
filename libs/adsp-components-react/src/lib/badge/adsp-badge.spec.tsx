import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdspBadge } from './adsp-badge';

describe('AdspBadge', () => {
  test('renders its label', () => {
    // Act
    render(<AdspBadge type="success">Approved</AdspBadge>);

    // Assert
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  test('marks its type for the stylesheet', () => {
    // Act
    render(<AdspBadge type="emergency">Rejected</AdspBadge>);

    // Assert
    expect(screen.getByText('Rejected')).toHaveClass('adsp-badge--emergency');
  });

  test('applies the current theme to its root element', () => {
    // Arrange
    render(<AdspBadge type="info">In review</AdspBadge>);

    // Act
    const statusColor = screen.getByText('In review').style.getPropertyValue('--adsp-color-status-info');

    // Assert
    expect(statusColor).toBe('var(--goa-color-info-default)');
  });

  test('applies instance overrides to its own badge token', () => {
    // Arrange
    render(
      <AdspBadge type="info" themeOverrides={{ borderRadius: '0' }}>
        In review
      </AdspBadge>,
    );

    // Act
    const borderRadius = screen.getByText('In review').style.getPropertyValue('--adsp-components-badge-border-radius');

    // Assert
    expect(borderRadius).toBe('0');
  });
});
