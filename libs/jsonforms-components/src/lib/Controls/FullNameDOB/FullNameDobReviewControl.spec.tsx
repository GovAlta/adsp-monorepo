import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FullNameDobReviewControl } from './FullNameDobReviewControl';
import { ControlProps } from '@jsonforms/core';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';

describe('FullNameDobReviewControl', () => {
  const mockGoToPage = jest.fn();

  const defaultProps: ControlProps = {
    data: {
      firstName: 'John',
      middleName: 'A.',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
    },
    path: 'fullNameDob',
    schema: { required: ['firstName', 'lastName', 'dateOfBirth'] },
    handleChange: jest.fn(),
    label: 'Full Name and Date of Birth',
    uischema: {
      type: 'Control',
      scope: '#/properties/fullNameDob',
      options: {
        stepId: 0,
      },
    },
    errors: '',
    rootSchema: {},
    id: 'fullname-dob-1',
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
          <JsonFormsStepperContext.Provider value={stepperContextValue}>
            <FullNameDobReviewControl {...defaultProps} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.getByText('Full Name and Date of Birth')).toBeInTheDocument();
    expect(screen.getByText('(required)')).toBeInTheDocument();
  });

  it('renders individual field rows with values including date of birth', () => {
    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue}>
            <FullNameDobReviewControl {...defaultProps} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.getByText('First name')).toBeInTheDocument();
    expect(screen.getByText('Middle name')).toBeInTheDocument();
    expect(screen.getByText('Last name')).toBeInTheDocument();
    expect(screen.getByText('Date of birth')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('1990-01-01')).toBeInTheDocument();
  });

  it('renders Change button only on the header row', () => {
    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue}>
            <FullNameDobReviewControl {...defaultProps} />
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
        dateOfBirth: '1990-01-01',
      },
    };

    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue}>
            <FullNameDobReviewControl {...propsWithoutMiddleName} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.queryByText('Middle name')).not.toBeInTheDocument();
    expect(screen.getByText('First name')).toBeInTheDocument();
    expect(screen.getByText('Last name')).toBeInTheDocument();
    expect(screen.getByText('Date of birth')).toBeInTheDocument();
  });

  it('displays error message when errors prop is provided', () => {
    const propsWithError = {
      ...defaultProps,
      errors: 'Full Name and Date of Birth is a required property',
    };

    render(
      <table>
        <tbody>
          <JsonFormsStepperContext.Provider value={stepperContextValue}>
            <FullNameDobReviewControl {...propsWithError} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.getByText('Full Name and Date of Birth is required')).toBeInTheDocument();
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
          <JsonFormsStepperContext.Provider value={stepperContextValue}>
            <FullNameDobReviewControl {...propsWithoutStepId} />
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
          <JsonFormsStepperContext.Provider value={stepperContextValue}>
            <FullNameDobReviewControl {...propsNotRequired} />
          </JsonFormsStepperContext.Provider>
        </tbody>
      </table>
    );

    expect(screen.queryByText('(required)')).not.toBeInTheDocument();
  });
});
