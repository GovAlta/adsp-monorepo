import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ControlProps } from '@jsonforms/core';
import { ContractInfoControlReview } from './ContactInfoControlReview';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';

describe('ContractInfoControlReview', () => {
  const mockGoToPage = jest.fn();

  const defaultProps: ControlProps = {
    data: {
      email: 'john@example.com',
      phone: '780-555-1234',
      preferredContactMethod: 'Phone',
    },
    path: 'contactInformation',
    schema: {
      required: ['email', 'phone', 'preferredContactMethod'],
    },
    handleChange: jest.fn(),
    label: 'Contact information',
    uischema: {
      type: 'Control',
      scope: '#/properties/contactInformation',
      options: {
        stepId: 0,
        enableEmail: true,
        enablePhone: true,
      },
    },
    errors: '',
    rootSchema: {},
    id: 'contact-1',
    enabled: true,
    visible: true,
    required: true,
  };

  const stepperContextValue = {
    goToPage: mockGoToPage,
    selectStepperState: jest.fn(),
  };

  const renderComponent = (props: ControlProps = defaultProps) =>
    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue}>
            <ContractInfoControlReview {...props} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>,
    );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders email, phone, and preferred contact method rows with values', () => {
    renderComponent();

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone number')).toBeInTheDocument();
    expect(screen.getByText('Preferred contact method')).toBeInTheDocument();

    expect(screen.getByTestId('email-control-contact-1')).toHaveTextContent('john@example.com');
    expect(screen.getByTestId('phone-control-contact-1')).toHaveTextContent('780-555-1234');
    expect(screen.getByTestId('preferred-contact-contact-1')).toHaveTextContent('Phone');
  });

  it('renders Change button for each row when stepId is provided', () => {
    renderComponent();

    const changeButtons = screen.getAllByText('Change');
    expect(changeButtons).toHaveLength(3);
  });

  it('does not render Change buttons when stepId is undefined', () => {
    const propsWithoutStepId: ControlProps = {
      ...defaultProps,
      uischema: {
        ...defaultProps.uischema,
        options: {
          enableEmail: true,
          enablePhone: true,
        },
      },
    };

    renderComponent(propsWithoutStepId);

    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });

  it('renders only email row when phone is disabled', () => {
    const emailOnlyProps: ControlProps = {
      ...defaultProps,
      uischema: {
        ...defaultProps.uischema,
        options: {
          stepId: 0,
          enableEmail: true,
          enablePhone: false,
        },
      },
    };

    renderComponent(emailOnlyProps);

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.queryByText('Phone number')).not.toBeInTheDocument();
    expect(screen.queryByText('Preferred contact method')).not.toBeInTheDocument();
  });

  it('renders only phone row when email is disabled', () => {
    const phoneOnlyProps: ControlProps = {
      ...defaultProps,
      uischema: {
        ...defaultProps.uischema,
        options: {
          stepId: 0,
          enableEmail: false,
          enablePhone: true,
        },
      },
    };

    renderComponent(phoneOnlyProps);

    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.getByText('Phone number')).toBeInTheDocument();
    expect(screen.queryByText('Preferred contact method')).not.toBeInTheDocument();
  });

  it('defaults preferred contact method to Email when missing', () => {
    const propsWithoutPreferredMethod: ControlProps = {
      ...defaultProps,
      data: {
        email: 'john@example.com',
        phone: '780-555-1234',
      },
    };

    renderComponent(propsWithoutPreferredMethod);

    expect(screen.getByTestId('preferred-contact-contact-1')).toHaveTextContent('Email');
  });

  it('shows required error for missing required email', () => {
    const propsWithMissingEmail: ControlProps = {
      ...defaultProps,
      data: {
        email: '',
        phone: '780-555-1234',
        preferredContactMethod: 'Phone',
      },
    };

    const { baseElement } = renderComponent(propsWithMissingEmail);

    expect(baseElement.querySelector('goa-form-item[error="Email is required"]')).toBeInTheDocument();
  });

  it('shows required error for missing required phone', () => {
    const propsWithMissingPhone: ControlProps = {
      ...defaultProps,
      data: {
        email: 'john@example.com',
        phone: '',
        preferredContactMethod: 'Phone',
      },
    };

    const { baseElement } = renderComponent(propsWithMissingPhone);

    expect(baseElement.querySelector('goa-form-item[error="Phone number is required"]')).toBeInTheDocument();
  });

  it('does not show required errors for fields not listed in schema.required', () => {
    const propsNotRequired: ControlProps = {
      ...defaultProps,
      data: {
        email: '',
        phone: '',
        preferredContactMethod: '',
      },
      schema: {
        required: [],
      },
    };

    const { baseElement } = renderComponent(propsNotRequired);

    expect(baseElement.querySelector('goa-form-item[error="Email is required"]')).not.toBeInTheDocument();
    expect(baseElement.querySelector('goa-form-item[error="Phone number is required"]')).not.toBeInTheDocument();
    expect(
      baseElement.querySelector('goa-form-item[error="Preferred contact method is required"]'),
    ).not.toBeInTheDocument();
  });

  it('throws an error when both email and phone are disabled', () => {
    const invalidProps: ControlProps = {
      ...defaultProps,
      uischema: {
        ...defaultProps.uischema,
        options: {
          stepId: 0,
          enableEmail: false,
          enablePhone: false,
        },
      },
    };

    expect(() => renderComponent(invalidProps)).toThrow('At least one contact method must be enabled');
  });
});
