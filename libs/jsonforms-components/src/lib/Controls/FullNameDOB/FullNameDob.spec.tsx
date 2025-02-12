import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    const component = render(
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

    const firstNameInput = component.getByTestId('name-form-first-name');
    expect((firstNameInput as HTMLInputElement).value).toBe(defaultFormData.firstName);

    const middleNameInput = component.getByTestId('name-form-middle-name');
    expect((middleNameInput as HTMLInputElement).value).toBe(defaultFormData.middleName);

    const lastNameInput = component.getByTestId('name-form-last-name');
    expect((lastNameInput as HTMLInputElement).value).toBe(defaultFormData.lastName);

    const dobInput = component.getByTestId('dob-form-dateOfBirth');
    expect((dobInput as HTMLInputElement).value).toBe(defaultFormData.dateOfBirth);
  });

  it('renders with required values', () => {
    const component = render(
      <FullNameDobControl
        data={{...defaultFormData, lastName: null}}
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
          required: ['firstName', 'middleName', 'lastName', 'dateOfBirth']
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

    const firstNameInput = component.getByTestId('name-form-first-name');
    expect((firstNameInput as HTMLInputElement).value).toBe(defaultFormData.firstName);

    const middleNameInput = component.getByTestId('name-form-middle-name');
    expect((middleNameInput as HTMLInputElement).value).toBe(defaultFormData.middleName);

    const lastNameFormItem = component.getByTestId('name-form-last-name').parentElement;
    expect(lastNameFormItem?.getAttribute('requirement')).toBe('required');

    const dobInput = component.getByTestId('dob-form-dateOfBirth');
    expect((dobInput as HTMLInputElement).value).toBe(defaultFormData.dateOfBirth);
  });

  it('calls handleChange on user input in first name', () => {
    render(
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

    const firstNameInput = screen.getByTestId('name-form-first-name');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    fireEvent(
      firstNameInput,
      new CustomEvent('_change', {
        detail: { name: 'firstName', value: 'Jane' },
      })
    );

    expect((firstNameInput as HTMLInputElement).value).toBe('Jane');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      firstName: 'Jane',
    });
  });

  it('can disable inputs', () => {
    const { getByTestId } = render(
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
    expect(getByTestId('name-form-middle-name').getAttribute('disabled')).toBe('true');
  });

  it('calls handleChange on user input in middle name', () => {
    render(
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

    const middleNameInput = screen.getByTestId('name-form-middle-name');
    fireEvent.change(middleNameInput, { target: { value: 'B.' } });

    fireEvent(
      middleNameInput,
      new CustomEvent('_change', {
        detail: { name: 'middleName', value: 'B.' },
      })
    );

    expect((middleNameInput as HTMLInputElement).value).toBe('B.');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      middleName: 'B.',
    });
  });

  it('calls handleChange on user input in last name', () => {
    render(
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

    const lastNameInput = screen.getByTestId('name-form-last-name');

    fireEvent(
      lastNameInput,
      new CustomEvent('_change', {
        detail: { name: 'lastName', value: 'Smith' },
      })
    );

    expect((lastNameInput as HTMLInputElement).value).toBe('Smith');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      lastName: 'Smith',
    });
  });

  it('calls handleChange on user input in date of birth', () => {
    render(
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

    const dobInput = screen.getByTestId('dob-form-dateOfBirth');
    fireEvent.change(dobInput, { target: { value: '2000-12-12' } });

    fireEvent(
      dobInput,
      new CustomEvent('_change', {
        detail: { name: 'dateOfBirth', value: '2000-12-12' },
      })
    );

    expect((dobInput as HTMLInputElement).value).toBe('2000-12-12');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      dateOfBirth: '2000-12-12',
    });
  });

  it('calls handleRequiredFieldBlur on user input in date of birth', () => {
    render(
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

    const dobInput = screen.getByTestId('dob-form-dateOfBirth');
    fireEvent(
      dobInput,
      new CustomEvent('_change', {
        detail: { name: 'dateOfBirth', value: '2000-12-12' },
      })
    );

    fireEvent(
      dobInput,
      new CustomEvent('_blur', {
        detail: { name: 'dateOfBirth', value: '2000-12-12' },
      })
    );

    expect((dobInput as HTMLInputElement).value).toBe('2000-12-12');
    expect(mockHandleChange).toBeCalledTimes(1);
    expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
      ...defaultFormData,
      dateOfBirth: '2000-12-12',
    });
  });

  it('test fullnameDoB tester', () => {
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
    const middleNameReview = screen.getByTestId('middleName-control-full-name-dob-review-empty');
    const lastNameReview = screen.getByTestId('lastName-control-full-name-dob-review-empty');
    const dobReview = screen.getByTestId('dob-control-full-name-dob-review-empty');
    await (async () => {
      expect(firstNameReview).toHaveValue('');
      expect(middleNameReview).toHaveValue('');
      expect(lastNameReview).toHaveValue('');
      expect(dobReview).toHaveValue('');
    });
  });
});
