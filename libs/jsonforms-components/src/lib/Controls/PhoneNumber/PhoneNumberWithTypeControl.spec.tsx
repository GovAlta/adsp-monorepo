import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneNumberWithTypeControl } from './PhoneNumberWithTypeControl';
import { ControlProps } from '@jsonforms/core';

describe('PhoneNumberWithTypeControl', () => {
  const mockHandleChange = jest.fn();

  const defaultProps: ControlProps = {
    data: { number: '(780) 123-4567', type: 'Mobile' },
    path: 'phoneNumberWithType',
    schema: { type: 'object' },
    uischema: { type: 'Control', scope: '#/properties/phoneNumberWithType' },
    handleChange: mockHandleChange,
    label: '',
    errors: '',
    rootSchema: {},
    id: 'phone-number-type',
    enabled: true,
    visible: true,
  };

  afterEach(() => jest.clearAllMocks());

  it('renders number input and dropdown with correct values', () => {
    const { container } = render(<PhoneNumberWithTypeControl {...defaultProps} />);

    const numberInput = container.querySelector('goa-input[name="number"]');
    const dropdown = container.querySelector('goa-dropdown[name="type"]');

    expect(numberInput).not.toBeNull();
    expect(dropdown).not.toBeNull();

    expect(numberInput).toHaveAttribute('value', '(780) 123-4567');
    expect(dropdown).toHaveAttribute('value', 'Mobile');
  });

  it('calls handleChange when phone number changes', () => {
    render(<PhoneNumberWithTypeControl {...defaultProps} />);
    const numberInput = screen.getByPlaceholderText('(000) 000-0000');

    fireEvent(numberInput, new CustomEvent('_change', { detail: { name: 'number', value: '(403) 555-9999' } }));

    expect(mockHandleChange).toHaveBeenCalledWith('phoneNumberWithType', {
      number: '(403) 555-9999',
      type: 'Mobile',
    });
  });

  it('calls handleChange when type changes', () => {
    const { container } = render(<PhoneNumberWithTypeControl {...defaultProps} />);
    const dropdown = container.querySelector('goa-dropdown[name="type"]');

    fireEvent(dropdown!, new CustomEvent('_change', { detail: { name: 'type', value: 'Landline' } }));

    expect(mockHandleChange).toHaveBeenCalledWith('phoneNumberWithType', {
      number: '(780) 123-4567',
      type: 'Landline',
    });
  });
});
