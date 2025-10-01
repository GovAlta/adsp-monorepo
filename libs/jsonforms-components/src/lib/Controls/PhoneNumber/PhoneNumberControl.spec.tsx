import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneNumberControl } from './PhoneNumberControl';
import { ControlProps } from '@jsonforms/core';

describe('PhoneNumberControl', () => {
  const mockHandleChange = jest.fn();

  const defaultProps: ControlProps = {
    data: '(780) 123-4567',
    path: 'phoneNumber',
    schema: { type: 'string' },
    uischema: { type: 'Control', scope: '#/properties/phoneNumber' },
    handleChange: mockHandleChange,
    label: '',
    errors: '',
    rootSchema: {},
    id: 'phone-number',
    enabled: true,
    visible: true,
  };

  afterEach(() => jest.clearAllMocks());

  it('renders phone input with initial value', () => {
    const { container } = render(<PhoneNumberControl {...defaultProps} />);
    const input = container.querySelector('[testid="phone-input-phoneNumber"]');
    expect(input).toHaveAttribute('value', '(780) 123-4567');
  });

  it('calls handleChange when user types a valid phone number', () => {
    const { container } = render(<PhoneNumberControl {...defaultProps} />);
    const input = container.querySelector('[testid="phone-input-phoneNumber"]')!;

    fireEvent(
      input,
      new CustomEvent('_change', {
        detail: { name: 'phoneNumber', value: '(403) 555-1212' },
      })
    );

    expect(mockHandleChange).toHaveBeenCalledWith('phoneNumber', '(403) 555-1212');
  });

  it('displays error when input is invalid', () => {
    render(<PhoneNumberControl {...defaultProps} />);
    const { container } = render(<PhoneNumberControl {...defaultProps} />);
    const input = container.querySelector('[testid="phone-input-phoneNumber"]');

    fireEvent(input!, new CustomEvent('_change', { detail: { name: 'phoneNumber', value: '123' } }));

    const formItem = container.querySelector('[testid="form-item-phoneNumber"]');
    expect(formItem).toHaveAttribute('error', 'Must be a valid 10-digit phone number in format (000) 000-0000');
  });
});
