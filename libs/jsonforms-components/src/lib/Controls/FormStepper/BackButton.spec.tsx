import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BackButton } from './BackButton';

describe('BackButton', () => {
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
