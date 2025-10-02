import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhoneNumberWithTypeControl } from './PhoneNumberWithTypeControl';
import { ControlProps } from '@jsonforms/core';
import { PhoneNumberWithTypeReviewControl } from './PhoneNumberWithTypeReviewControl';

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

  it('renders with empty data gracefully', () => {
    const props = { ...defaultProps, data: {} };
    const { container } = render(<PhoneNumberWithTypeControl {...props} />);
    const numberInput = container.querySelector('goa-input[name="number"]');
    const dropdown = container.querySelector('goa-dropdown[name="type"]');

    expect(numberInput).toHaveAttribute('value', '');
    expect(dropdown).toHaveAttribute('value', '');
  });

  it('renders disabled inputs when enabled=false', () => {
    const props = { ...defaultProps, enabled: false };
    const { container } = render(<PhoneNumberWithTypeControl {...props} />);
    const numberInput = container.querySelector('goa-input[name="number"]');
    const dropdown = container.querySelector('goa-dropdown[name="type"]');

    expect(numberInput).toHaveAttribute('disabled');
    expect(dropdown).toHaveAttribute('disabled');
  });

  it('does not render content when visible=false', () => {
    const props = { ...defaultProps, visible: false };
    const { container } = render(<PhoneNumberWithTypeControl {...props} />);
    expect(container.querySelector('goa-input')).not.toBeVisible();
    expect(container.querySelector('goa-dropdown')).not.toBeVisible();
  });

  it('calls handleChange correctly when both number and type change', () => {
    const { container } = render(<PhoneNumberWithTypeControl {...defaultProps} />);
    const numberInput = screen.getByPlaceholderText('(000) 000-0000');
    const dropdown = container.querySelector('goa-dropdown[name="type"]');

    fireEvent(numberInput, new CustomEvent('_change', { detail: { name: 'number', value: '(825) 111-2222' } }));
    fireEvent(dropdown!, new CustomEvent('_change', { detail: { name: 'type', value: 'Work' } }));

    expect(mockHandleChange).toHaveBeenNthCalledWith(1, 'phoneNumberWithType', {
      number: '(825) 111-2222',
      type: 'Mobile',
    });
    expect(mockHandleChange).toHaveBeenNthCalledWith(2, 'phoneNumberWithType', {
      number: '(825) 111-2222',
      type: 'Work',
    });
  });
});

describe('PhoneNumberWithTypeReviewControl', () => {
  const baseProps: ControlProps = {
    data: { number: '(780) 123-4567', type: 'Mobile' },
    path: 'phoneNumberWithType',
    schema: { type: 'object' },
    uischema: { type: 'Control', scope: '#/properties/phoneNumberWithType' },
    handleChange: jest.fn(),
    label: '',
    errors: '',
    rootSchema: {},
    id: 'review-id',
    enabled: true,
    visible: true,
  };

  it('renders phone number and type values', () => {
    render(<PhoneNumberWithTypeReviewControl {...baseProps} />);
    expect(screen.getByTestId('phone-number-control-review-id')).toHaveTextContent('(780) 123-4567');
    expect(screen.getByTestId('phone-type-control-review-id')).toHaveTextContent('Mobile');
  });

  it('renders empty strings when no values provided', () => {
    const props = { ...baseProps, data: {} };
    render(<PhoneNumberWithTypeReviewControl {...props} />);
    expect(screen.getByTestId('phone-number-control-review-id')).toHaveTextContent('');
    expect(screen.getByTestId('phone-type-control-review-id')).toHaveTextContent('');
  });

  it('shows required errors when fields are missing and required=true', () => {
    const props = { ...baseProps, data: {}, required: true };
    const { container } = render(<PhoneNumberWithTypeReviewControl {...props} />);

    const formItems = container.querySelectorAll('goa-form-item');
    const errors = Array.from(formItems).map((item) => item.getAttribute('error'));

    expect(errors).toContain('Phone number is required');
    expect(errors).toContain('Phone type is required');
  });

  it('does not show errors when required=false', () => {
    const props = { ...baseProps, data: {}, required: false };
    const { container } = render(<PhoneNumberWithTypeReviewControl {...props} />);

    const formItems = container.querySelectorAll('goa-form-item');
    formItems.forEach((item) => {
      expect(item?.getAttribute('error')).toBe('');
    });
  });
});
