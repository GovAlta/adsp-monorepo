import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FullNameControlReview } from './FullNameControlReview';
import { ControlProps } from '@jsonforms/core';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';

describe('FullNameControlReview', () => {
  const mockGoToPage = jest.fn();

  const defaultProps: ControlProps = {
    data: {
      firstName: 'John',
      middleName: 'A.',
      lastName: 'Doe',
    },
    path: 'fullName',
    schema: { required: ['firstName', 'lastName'] },
    handleChange: jest.fn(),
    label: 'Full Name',
    uischema: {
      type: 'Control',
      scope: '#/properties/fullName',
      options: {
        stepId: 0,
      },
    },
    errors: '',
    rootSchema: {},
    id: 'fullname-1',
    enabled: true,
    visible: true,
    required: true,
  };

  const stepperContextValue = {
    goToPage: mockGoToPage,
    selectStepperState: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header row with label and required indicator', () => {
    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue as any}>
            <FullNameControlReview {...defaultProps} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('renders individual field rows with values', () => {
    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue as any}>
            <FullNameControlReview {...defaultProps} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.getByText('First name')).toBeInTheDocument();
    expect(screen.getByText('Middle name')).toBeInTheDocument();
    expect(screen.getByText('Last name')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
  });

  it('renders Change button only on the header row', () => {
    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue as any}>
            <FullNameControlReview {...defaultProps} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    const changeButtons = screen.getAllByText('Change');
    expect(changeButtons).toHaveLength(1);
  });

  it('does not render middle name row when middleName is not present', () => {
    const propsWithoutMiddleName = {
      ...defaultProps,
      data: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue as any}>
            <FullNameControlReview {...propsWithoutMiddleName} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.queryByText('Middle name')).not.toBeInTheDocument();
    expect(screen.getByText('First name')).toBeInTheDocument();
    expect(screen.getByText('Last name')).toBeInTheDocument();
  });

  it('displays error message when errors prop is provided', () => {
    const propsWithError = {
      ...defaultProps,
      errors: 'Full Name is a required property',
    };

    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue as any}>
            <FullNameControlReview {...propsWithError} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.getByText('Full Name is required')).toBeInTheDocument();
  });

  it('does not render Change button when stepId is undefined', () => {
    const propsWithoutStepId = {
      ...defaultProps,
      uischema: {
        ...defaultProps.uischema,
        options: {},
      },
    };

    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue as any}>
            <FullNameControlReview {...propsWithoutStepId} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });

  it('does not show required indicator when not required', () => {
    const propsNotRequired = {
      ...defaultProps,
      required: false,
    };

    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue as any}>
            <FullNameControlReview {...propsNotRequired} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.queryByText('(required)')).not.toBeInTheDocument();
  });
});
