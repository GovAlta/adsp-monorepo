import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContractInfoControl } from './ContractInfoControl';
import { ControlProps } from '@jsonforms/core';

type MockChildProps = {
  data?: unknown;
  path?: string;
  enabled?: boolean;
  visible?: boolean;
  required?: boolean;
  uischema?: ControlProps['uischema'];
};

// Mock child components
jest.mock('../PhoneNumber', () => ({
  PhoneNumberControl: (props: MockChildProps) => <div data-testid="phone-control">{JSON.stringify(props)}</div>,
}));

jest.mock('../Inputs/InputEmailControl', () => ({
  GoAEmailInput: (props: MockChildProps) => <div data-testid="email-control">{JSON.stringify(props)}</div>,
}));

describe('ContractInfoControl', () => {
  const mockHandleChange = jest.fn();

  const baseProps: ControlProps = {
    data: {
      email: 'test@test.com',
      phone: '1234567890',
      preferredContactMethod: 'Email',
    },
    path: 'contact',
    id: 'contact-info',
    label: 'Contact information',
    errors: '',
    handleChange: mockHandleChange,
    enabled: true,
    visible: true,
    required: false,
    uischema: {
      type: 'Control',
      scope: '#',
      options: {},
    },
    schema: {},
    rootSchema: {},
    config: {},
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders both email and phone by default', () => {
    const { getByTestId } = render(<ContractInfoControl {...baseProps} />);

    expect(getByTestId('email-control')).toBeInTheDocument();
    expect(getByTestId('phone-control')).toBeInTheDocument();
  });

  it('renders only email when enablePhone is false', () => {
    const props = {
      ...baseProps,
      uischema: {
        ...baseProps.uischema,
        options: { enablePhone: false },
      },
    };

    const { getByTestId, queryByTestId } = render(<ContractInfoControl {...props} />);

    expect(getByTestId('email-control')).toBeInTheDocument();
    expect(queryByTestId('phone-control')).toBeNull();
  });

  it('renders only phone when enableEmail is false', () => {
    const props = {
      ...baseProps,
      uischema: {
        ...baseProps.uischema,
        options: { enableEmail: false },
      },
    };

    const { getByTestId, queryByTestId } = render(<ContractInfoControl {...props} />);

    expect(getByTestId('phone-control')).toBeInTheDocument();
    expect(queryByTestId('email-control')).toBeNull();
  });

  it('throws error if both email and phone are disabled', () => {
    const props = {
      ...baseProps,
      uischema: {
        ...baseProps.uischema,
        options: { enableEmail: false, enablePhone: false },
      },
    };

    expect(() => render(<ContractInfoControl {...props} />)).toThrow('At least one contact method must be enabled');
  });

  it('hides component when visible is false', () => {
    const { container } = render(<ContractInfoControl {...baseProps} visible={false} />);

    expect(container.firstChild).toHaveStyle('display: none');
  });

  it('shows dropdown when both email and phone are enabled', () => {
    const { container } = render(<ContractInfoControl {...baseProps} />);

    const dropdown = container.querySelector(`goa-dropdown[testid="preferred-contact-contact"]`);

    expect(dropdown).toBeInTheDocument();
  });

  it('does not show dropdown if only one method is enabled', () => {
    const props = {
      ...baseProps,
      uischema: {
        ...baseProps.uischema,
        options: { enablePhone: false },
      },
    };

    const { container } = render(<ContractInfoControl {...props} />);

    const dropdown = container.querySelector('goa-dropdown');
    expect(dropdown).toBeNull();
  });

  it('passes correct props to email control', () => {
    const { getByTestId } = render(<ContractInfoControl {...baseProps} />);

    const email = getByTestId('email-control');

    expect(email.textContent).toContain('"path":"contact.email"');
    expect(email.textContent).toContain('"data":"test@test.com"');
  });

  it('passes correct props to phone control', () => {
    const { getByTestId } = render(<ContractInfoControl {...baseProps} />);

    const phone = getByTestId('phone-control');

    expect(phone.textContent).toContain('"path":"contact.phone"');
    expect(phone.textContent).toContain('"data":"1234567890"');
  });

  it('disables dropdown when enabled is false', () => {
    const { container } = render(<ContractInfoControl {...baseProps} enabled={false} />);

    const dropdown = container.querySelector(`goa-dropdown[testid="preferred-contact-contact"]`);

    expect(dropdown).toHaveAttribute('disabled');
  });

  it('marks dropdown required when required=true', () => {
    const { container } = render(<ContractInfoControl {...baseProps} required={true} />);

    const formItem = container.querySelector('goa-form-item');

    expect(formItem).toHaveAttribute('requirement', 'required');
  });
});

describe('ContractInfoControl - emailFirst', () => {
  const baseProps: ControlProps = {
    data: {
      email: 'test@test.com',
      phone: '5551234567',
      preferredContactMethod: '',
    },
    id: 'contact-info',
    label: 'Contact information',
    errors: '',
    path: 'contact',
    handleChange: jest.fn(),
    enabled: true,
    schema: {},
    rootSchema: {},
    visible: true,
    required: false,
    uischema: {
      type: 'Control',
      scope: '#/properties/contact',
      options: {
        enableEmail: true,
        enablePhone: true,
      },
    },
  };

  it('renders email before phone when emailFirst is true', () => {
    const props = {
      ...baseProps,
      uischema: {
        ...baseProps.uischema,
        options: {
          ...baseProps.uischema.options,
          emailFirst: true,
        },
      },
    };

    render(<ContractInfoControl {...props} />);

    const email = screen.getByTestId('email-control');
    const phone = screen.getByTestId('phone-control');

    expect(email).toBeInTheDocument();
    expect(phone).toBeInTheDocument();

    expect(email.compareDocumentPosition(phone) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders phone before email when emailFirst is false', () => {
    const props = {
      ...baseProps,
      uischema: {
        ...baseProps.uischema,
        options: {
          ...baseProps.uischema.options,
          emailFirst: false,
        },
      },
    };

    render(<ContractInfoControl {...props} />);

    const email = screen.getByTestId('email-control');
    const phone = screen.getByTestId('phone-control');

    expect(phone.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
