import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneNumberControl } from './PhoneNumberControl';
import { ControlProps } from '@jsonforms/core';
import { PhoneNumberReviewControl } from './PhoneNumberReviewControl';

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
      }),
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

  it('uses a custom phoneMask from the UI schema', () => {
    const props = {
      ...defaultProps,
      data: '',
      uischema: {
        ...defaultProps.uischema,
        options: { phoneMask: '###-###-####' },
      },
    };

    const { container } = render(<PhoneNumberControl {...props} />);
    const input = container.querySelector('[testid="phone-input-phoneNumber"]');

    fireEvent(input!, new CustomEvent('_change', { detail: { name: 'phoneNumber', value: '4035551212' } }));

    expect(mockHandleChange).toHaveBeenCalledWith('phoneNumber', '403-555-1212');
  });

  it('shows the in-place phone template after mount', () => {
    const props = {
      ...defaultProps,
      data: '',
      uischema: {
        ...defaultProps.uischema,
        options: { inPlace: true },
      },
    };

    const { container } = render(<PhoneNumberControl {...props} />);
    const input = container.querySelector('[testid="phone-input-phoneNumber"]');

    expect(input).toHaveAttribute('value', '(###) ###-####');
  });

  it('does not set maxLength when the phone field is in-place', () => {
    const props = {
      ...defaultProps,
      data: '',
      uischema: {
        ...defaultProps.uischema,
        options: { inPlace: true },
      },
    };

    const { container } = render(<PhoneNumberControl {...props} />);
    const input = container.querySelector('[testid="phone-input-phoneNumber"]');

    expect(input?.getAttribute('maxlength')).toBeNull();
  });

  it('clears the error when the phone number becomes valid', () => {
    const { container } = render(<PhoneNumberControl {...defaultProps} />);
    const input = container.querySelector('[testid="phone-input-phoneNumber"]');

    fireEvent(input!, new CustomEvent('_change', { detail: { name: 'phoneNumber', value: '123' } }));
    fireEvent(input!, new CustomEvent('_change', { detail: { name: 'phoneNumber', value: '(403) 555-1212' } }));

    const formItem = container.querySelector('[testid="form-item-phoneNumber"]');
    expect(formItem).toHaveAttribute('error', '');
  });
});

describe('PhoneNumberReviewControl', () => {
  const baseProps: ControlProps = {
    data: '(587) 987-6543',
    path: 'phoneNumberReview',
    schema: { type: 'string' },
    uischema: { type: 'Control', scope: '#/properties/phoneNumberReview' },
    handleChange: jest.fn(),
    label: '',
    errors: '',
    rootSchema: {},
    id: 'review-id',
    enabled: true,
    visible: true,
  };

  it('renders phone number when data is provided', () => {
    render(<PhoneNumberReviewControl {...baseProps} />);
    expect(screen.getByTestId('phone-control-review-id')).toHaveTextContent('(587) 987-6543');
  });

  it('renders empty string when no data is provided', () => {
    const props = { ...baseProps, data: '' };
    render(<PhoneNumberReviewControl {...props} />);
    expect(screen.getByTestId('phone-control-review-id')).toHaveTextContent('');
  });

  it('shows required error when data is missing and required=true', () => {
    const props = { ...baseProps, data: '', required: true };
    const { container } = render(<PhoneNumberReviewControl {...props} />);
    const formItem = container.querySelector('goa-form-item');
    expect(formItem).toHaveAttribute('error', 'Phone number is required');
  });

  it('does not show error when required=false and data is missing', () => {
    const props = { ...baseProps, data: '', required: false };
    const { container } = render(<PhoneNumberReviewControl {...props} />);
    const formItem = container.querySelector('goa-form-item');
    expect(formItem).toHaveAttribute('error', '');
  });
});
