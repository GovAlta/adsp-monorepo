import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdspButton } from './adsp-button';

describe('AdspButton', () => {
  test('renders as a non-submitting button by default', () => {
    // Act
    render(<AdspButton>Approve</AdspButton>);

    // Assert
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveAttribute('type', 'button');
  });

  test('uses the primary variant by default', () => {
    // Act
    render(<AdspButton>Approve</AdspButton>);

    // Assert
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveClass('adsp-button--primary');
  });

  test('uses the requested variant', () => {
    // Act
    render(<AdspButton variant="secondary">Request changes</AdspButton>);

    // Assert
    expect(screen.getByRole('button', { name: 'Request changes' })).toHaveClass('adsp-button--secondary');
  });

  test('calls onClick when pressed', () => {
    // Arrange
    const onClick = jest.fn();
    render(<AdspButton onClick={onClick}>Approve</AdspButton>);

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    // Assert
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('passes native button attributes through', () => {
    // Act
    render(<AdspButton disabled>Withdraw</AdspButton>);

    // Assert
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeDisabled();
  });

  test('applies the current theme to its root element', () => {
    // Arrange
    render(<AdspButton>Approve</AdspButton>);

    // Act
    const interactiveColor = screen
      .getByRole('button', { name: 'Approve' })
      .style.getPropertyValue('--adsp-color-interactive-default');

    // Assert
    expect(interactiveColor).toBe('var(--goa-color-interactive-default)');
  });

  test('applies instance overrides to its own button token', () => {
    // Arrange
    render(<AdspButton themeOverrides={{ primary: { background: '#00703c' } }}>Approve</AdspButton>);

    // Act
    const background = screen
      .getByRole('button', { name: 'Approve' })
      .style.getPropertyValue('--adsp-components-button-primary-background');

    // Assert
    expect(background).toBe('#00703c');
  });

  test('does not pass themeOverrides to the native button', () => {
    // Act
    render(<AdspButton themeOverrides={{ borderRadius: '0' }}>Approve</AdspButton>);

    // Assert
    expect(screen.getByRole('button', { name: 'Approve' })).not.toHaveAttribute('themeoverrides');
  });
});
