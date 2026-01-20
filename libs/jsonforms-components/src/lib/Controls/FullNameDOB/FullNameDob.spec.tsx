import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FullNameDobReviewControl } from './FullNameDobReviewControl';
import {
  ControlElement,
  ControlProps,
  JsonSchema4,
  JsonSchema7,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';
import { isFullNameDoB } from './FullNameDobTester';
import { FullNameDobControl } from './FullNameDobControl';

describe('FullNameDobControl', () => {
  const dummyTestContext = {
    rootSchema: {},
    config: {},
  } as TesterContext;

  const mockHandleChange = jest.fn(() => Promise.resolve());
  const textBoxUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/firstName',
    label: 'My First name',
  };
  const defaultFormData = {
    firstName: 'John',
    middleName: 'A.',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all name fields and date of birth with the correct initial values', () => {
    const { baseElement } = render(
      <FullNameDobControl
        data={defaultFormData}
        handleChange={mockHandleChange}
        path="path-to-data"
        schema={{}}
        uischema={{} as ControlElement}
        label={''}
        errors={''}
        rootSchema={{}}
        id={''}
        enabled={false}
        visible={false}
      />
    );
    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    const middleNameInput = baseElement.querySelector("goa-input[testId='name-form-middle-name']");

    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");

    const dobInput = baseElement.querySelector("goa-input[testId='dob-form-dateOfBirth']");
    expect(firstNameInput?.getAttribute('value')).toBe(defaultFormData.firstName);
    expect(middleNameInput?.getAttribute('value')).toBe(defaultFormData.middleName);
    expect(lastNameInput?.getAttribute('value')).toBe(defaultFormData.lastName);
    expect(dobInput?.getAttribute('value')).toBe(defaultFormData.dateOfBirth);
  });

  it('renders with required values', () => {
    const { baseElement } = render(
      <FullNameDobControl
        data={{ ...defaultFormData, lastName: null }}
        handleChange={mockHandleChange}
        path="path-to-data"
        schema={{
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            middleName: { type: 'string' },
            lastName: { type: 'string' },
            dateOfBirth: { type: 'string' },
          },
          required: ['firstName', 'middleName', 'lastName', 'dateOfBirth'],
        }}
        uischema={{} as ControlElement}
        label={''}
        errors={''}
        rootSchema={{}}
        id={''}
        enabled={false}
        visible={false}
      />
    );

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    const middleNameInput = baseElement.querySelector("goa-input[testId='name-form-middle-name']");

    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");
    const lastNameFormItem = baseElement.querySelector("goa-form-item[testId='form-item-last-name']");
    const dobInput = baseElement.querySelector("goa-input[testId='dob-form-dateOfBirth']");
    expect(firstNameInput?.getAttribute('value')).toBe(defaultFormData.firstName);
    expect(middleNameInput?.getAttribute('value')).toBe(defaultFormData.middleName);
    expect(lastNameInput?.getAttribute('value')).toBe('');

    expect(dobInput?.getAttribute('value')).toBe(defaultFormData.dateOfBirth);
    expect(lastNameFormItem?.getAttribute('requirement')).toBe('required');
  });

  it('displays required error message on blur when first name is empty', async () => {
    const { baseElement } = render(
      <FullNameDobControl
        data={{ ...defaultFormData, firstName: '' }} // First name is empty
        handleChange={mockHandleChange}
        path="path-to-data"
        schema={{
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            middleName: { type: 'string' },
            lastName: { type: 'string' },
            dateOfBirth: { type: 'string' },
          },
          required: ['firstName', 'middleName', 'lastName', 'dateOfBirth'],
        }}
        uischema={{} as ControlElement}
        label={''}
        errors={''}
        rootSchema={{}}
        id={''}
        enabled={true}
        visible={true}
      />
    );

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    if (!firstNameInput) {
      throw new Error('First name input not found');
    }

    // Simulate clearing the field and blurring
    fireEvent(
      firstNameInput,
      new CustomEvent('_change', {
        detail: { name: 'firstName', value: '' },
      })
    );
    fireEvent(
      firstNameInput,
      new CustomEvent('_blur', {
        detail: { name: 'firstName' },
      })
    );

    await waitFor(() => {
      const formItem = baseElement.querySelector("goa-form-item[testid='form-item-first-name']");
      expect(formItem?.getAttribute('error')).toBe('First name is required');
    });
  });

  it('calls handleChange on user input in first name', () => {
    const { baseElement } = render(
      <FullNameDobControl
        data={defaultFormData}
        handleChange={mockHandleChange}
        path="path-to-data"
        schema={{}}
        uischema={{} as ControlElement}
        label={''}
        errors={''}
        rootSchema={{}}
        id={''}
        enabled={false}
        visible={false}
      />
    );

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");

    fireEvent(
      firstNameInput,
      new CustomEvent('_change', {
        detail: { name: 'firstName', value: 'Jane' },
      })
    );

    expect(firstNameInput?.getAttribute('value')).toBe('Jane');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      firstName: 'Jane',
    });
  });

  it('can disable inputs', () => {
    const { baseElement } = render(
      <FullNameDobControl
        data={defaultFormData}
        handleChange={mockHandleChange}
        path="path-to-data"
        schema={{}}
        uischema={{} as ControlElement}
        label={''}
        errors={''}
        rootSchema={{}}
        id={''}
        enabled={false}
        visible={false}
      />
    );
    const middleNameInput = baseElement.querySelector("goa-input[testId='name-form-middle-name']");
    expect(middleNameInput.getAttribute('disabled')).toBe('true');
  });

  it('calls handleChange on user input in middle name', () => {
    const { baseElement } = render(
      <FullNameDobControl
        data={defaultFormData}
        handleChange={mockHandleChange}
        path="path-to-data"
        schema={{}}
        uischema={{} as ControlElement}
        label={''}
        errors={''}
        rootSchema={{}}
        id={''}
        enabled={false}
        visible={false}
      />
    );
    const middleNameInput = baseElement.querySelector("goa-input[testId='name-form-middle-name']");

    fireEvent(
      middleNameInput,
      new CustomEvent('_change', {
        detail: { name: 'middleName', value: 'B.' },
      })
    );

    expect(middleNameInput.getAttribute('value')).toBe('B.');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      middleName: 'B.',
    });
  });

  it('calls handleChange on user input in last name', () => {
    const { baseElement } = render(
      <FullNameDobControl
        data={defaultFormData}
        handleChange={mockHandleChange}
        path="path-to-data"
        schema={{}}
        uischema={{} as ControlElement}
        label={''}
        errors={''}
        rootSchema={{}}
        id={''}
        enabled={false}
        visible={false}
      />
    );
    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");

    fireEvent(
      lastNameInput,
      new CustomEvent('_change', {
        detail: { name: 'lastName', value: 'Smith' },
      })
    );

    expect(lastNameInput?.getAttribute('value')).toBe('Smith');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      lastName: 'Smith',
    });
  });

  it('calls handleChange on user input in date of birth', () => {
    const { baseElement } = render(
      <FullNameDobControl
        data={defaultFormData}
        handleChange={mockHandleChange}
        path="path-to-data"
        schema={{}}
        uischema={{} as ControlElement}
        label={''}
        errors={''}
        rootSchema={{}}
        id={''}
        enabled={false}
        visible={false}
      />
    );
    const dobInput = baseElement.querySelector("goa-input[testId='dob-form-dateOfBirth']");

    fireEvent(
      dobInput,
      new CustomEvent('_change', {
        detail: { name: 'dateOfBirth', value: '2000-12-12' },
      })
    );

    expect(dobInput?.getAttribute('value')).toBe('2000-12-12');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      dateOfBirth: '2000-12-12',
    });
  });

  it('calls handleRequiredFieldBlur on user input in date of birth', () => {
    const { baseElement } = render(
      <FullNameDobControl
        data={defaultFormData}
        handleChange={mockHandleChange}
        path="path-to-data"
        schema={{}}
        uischema={{} as ControlElement}
        label={''}
        errors={''}
        rootSchema={{}}
        id={''}
        enabled={false}
        visible={false}
      />
    );
    const dobInput = baseElement.querySelector("goa-input[testId='dob-form-dateOfBirth']");

    fireEvent(
      dobInput,
      new CustomEvent('_change', {
        detail: { name: 'dateOfBirth', value: '2000-12-12' },
      })
    );

    fireEvent.blur(dobInput);

    expect(dobInput?.getAttribute('value')).toBe('2000-12-12');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      dateOfBirth: '2000-12-12',
    });
  });

  it('test full name DoB tester', () => {
    expect(
      isFullNameDoB(
        {
          type: 'Category',
        },
        {},
        dummyTestContext
      )
    ).toBe(false);
  });

  expect(
    isFullNameDoB(
      {
        type: 'Control',
        scope: '#/properties/personFullName',
      } as UISchemaElement,
      {
        type: 'object',
        properties: {
          personFullName: {
            $comment: 'The full name of a person including first, middle, and last names.',
            type: 'object',
            properties: {
              firstName: {
                $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                type: 'string',
                pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
              } as JsonSchema7,
              middleName: {
                $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                type: 'string',
                pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
              } as JsonSchema7,
              lastName: {
                $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                type: 'string',
                pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
              } as JsonSchema7,
            },
            required: ['firstName', 'lastName'],
            errorMessage: {
              properties: {
                firstName: 'Include period (.) if providing your initial',
                middleName: 'Include period (.) if providing your initial',
                lastName: 'Include period (.) if providing your initial',
              },
            },
          } as JsonSchema7,
        },
      },
      dummyTestContext
    )
  ).toBe(false);

  expect(
    isFullNameDoB(
      {
        type: 'Control',
        scope: '#/properties/dateOfBirth',
      } as UISchemaElement,
      {
        type: 'object',
        properties: {
          dateOfBirth: {
            $comment: 'The full name of a person including first, middle, and last names.',
            type: 'object',
            properties: {
              firstName: {
                $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                type: 'string',
                pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
              } as JsonSchema4,
              middleName: {
                $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                type: 'string',
                pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
              } as JsonSchema4,
              lastName: {
                $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                type: 'string',
                pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
              } as JsonSchema4,
              dateOfBirth: {
                type: 'string',
                format: 'date',
              },
            },
            required: ['firstName', 'lastName'],
            errorMessage: {
              properties: {
                firstName: 'Include period (.) if providing your initial',
                middleName: 'Include period (.) if providing your initial',
                lastName: 'Include period (.) if providing your initial',
              },
            },
          } as JsonSchema4,
        },
      },
      dummyTestContext
    )
  ).toBe(true);
});

describe('FullName Dob ReviewControl', () => {
  const defaultReviewProps: ControlProps = {
    data: {
      firstName: 'John',
      middleName: 'A.',
      lastName: 'Doe',
      dateOfBirth: '2024-10-10',
    },
    id: 'full-name-dob-review',
    label: '',
    uischema: {
      type: 'Control',
      scope: '',
    },
    errors: '',
    rootSchema: {},
    schema: {},
    enabled: false,
    visible: false,
    path: '',
    handleChange: function (path: string, value: string): void {
      throw new Error('Function not implemented.');
    },
  };

  it('renders the FullNameDobReviewControl component with correct data', async () => {
    render(<FullNameDobReviewControl {...defaultReviewProps} />);

    const firstNameReview = screen.getByTestId('firstName-control-full-name-dob-review');
    const middleNameReview = screen.getByTestId('middleName-control-full-name-dob-review');
    const lastNameReview = screen.getByTestId('lastName-control-full-name-dob-review');
    const dobReview = screen.getByTestId('dob-control-full-name-dob-review');
    await (async () => {
      expect(firstNameReview).toHaveTextContent('John');
      expect(middleNameReview).toHaveTextContent('A.');
      expect(lastNameReview).toHaveTextContent('Doe');
      expect(dobReview).toHaveTextContent('2024-10-10');
    });
  });

  it('renders empty values when no data is provided', async () => {
    const defaultProps: ControlProps = {
      data: {
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: null,
      },
      path: 'path-to-data',
      schema: { required: ['firstName', 'lastName'] },
      handleChange: () => {},
      label: '',
      uischema: {
        type: 'Control',
        scope: '',
      },
      errors: '',
      rootSchema: {},
      id: 'full-name-dob-review-empty',
      enabled: false,
      visible: false,
    };
    render(<FullNameDobReviewControl {...defaultProps} />);

    const firstNameReview = screen.getByTestId('firstName-control-full-name-dob-review-empty');
    expect(firstNameReview).toBeInTheDocument();
  });
});
