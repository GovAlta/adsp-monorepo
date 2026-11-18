import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BackButton } from './BackButton';

describe('BackButton', () => {
  it('provides a 44 by 44 pixel minimum hit area without changing the visible styling', () => {
    // Arrange
    render(<BackButton text="Change" link={jest.fn()} showBackIcon={false} />);

    // Act
    const button = screen.getByTestId('back-button-click');

    // Assert
    expect(button).toHaveStyle({
      background: 'none',
      border: '0',
      minHeight: '44px',
      minWidth: '44px',
      padding: '10px 0',
    });
  });

  it('should render back button with text', () => {
    const mockLink = jest.fn();
    const { container } = render(<BackButton text="Go Back" link={mockLink} />);

    expect(container).toBeTruthy();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('should call link function when button is clicked', () => {
    const mockLink = jest.fn();
    render(<BackButton text="Go Back" link={mockLink} />);

    const button = screen.getByTestId('back-button-click');
    fireEvent.click(button);
    expect(mockLink).toHaveBeenCalled();
  });

  it('should render back button with different text', () => {
    const mockLink = jest.fn();
    const { container } = render(<BackButton text="Back" link={mockLink} />);

    expect(container).toBeTruthy();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });
});
