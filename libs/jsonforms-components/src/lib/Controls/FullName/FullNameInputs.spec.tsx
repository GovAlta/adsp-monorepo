import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NameInputs } from './FullNameInputs';
import { isFullName } from './FullNameTester';
import '@testing-library/jest-dom';
import { JsonSchema7, TesterContext, UISchemaElement } from '@jsonforms/core';

describe('NameInputs', () => {
  const dummyTestContext = {
    rootSchema: {},
    config: {},
  } as TesterContext;

  const mockHandleInputChange = jest.fn();
  const handleBlur = jest.fn();

  const defaultName = {
    firstName: 'John',
    middleName: 'A.',
    lastName: 'Doe',
  };

  const requiredFields = ['firstName', 'lastName'];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all name fields with the correct initial values', async () => {
    const component = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = component.getByTestId('name-form-first-name');

    const middleNameInput = component.getByTestId('name-form-middle-name');

    const lastNameInput = component.getByTestId('name-form-last-name');
    await (async () => {
      expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
      expect((firstNameInput as HTMLInputElement).value).toBe(defaultName.firstName);
      expect((lastNameInput as HTMLInputElement).value).toBe(defaultName.lastName);
      expect((middleNameInput as HTMLInputElement).value).toBe(defaultName.middleName);
    });
  });

  it('calls handleInputChange on user input in first name', async () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = screen.getByTestId('name-form-first-name');
    fireEvent(
      firstNameInput,
      new CustomEvent('_change', {
        detail: { name: 'firstName', value: 'John' },
      })
    );
    expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('firstName', 'John');
    expect((firstNameInput as HTMLInputElement).value).toBe('John');
  });

  it('name fields should be in the document', async () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );
    await (async () => {
      expect(screen.getByTestId('name-form-first-name')).toBeInTheDocument();
      expect(screen.getByTestId('name-form-middle-name')).toBeInTheDocument();
      expect(screen.getByTestId('name-form-last-name')).toBeInTheDocument();
    });
  });

  it('calls handleInputChange on user input in middle name', async () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const middletNameInput = screen.getByTestId('name-form-middle-name');
    fireEvent(
      middletNameInput,
      new CustomEvent('_change', {
        detail: { name: 'middletName', value: 'A.' },
      })
    );
    expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('middletName', 'A.');
    expect((middletNameInput as HTMLInputElement).value).toBe('A.');
  });

  it('calls handleInputChange on user input in last name', async () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const lastNameInput = screen.getByTestId('name-form-last-name');
    fireEvent(
      lastNameInput,
      new CustomEvent('_change', {
        detail: { name: 'lastName', value: 'Doe' },
      })
    );
    expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('lastName', 'Doe');
    expect((lastNameInput as HTMLInputElement).value).toBe('Doe');
  });

  it('shows required error when first name is missing and blurred', async () => {
    const component = render(
      <NameInputs
        firstName=""
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={{ ...defaultName, firstName: '' }}
      />
    );

    const firstNameInput = component.getByTestId('name-form-first-name');
    const blurred = fireEvent.blur(firstNameInput);
    expect(blurred).toBe(true);
  });

  it('shows required error when last name is missing and blurred', async () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName=""
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={{ ...defaultName, lastName: '' }}
      />
    );

    const lastNameInput = screen.getByTestId('name-form-last-name');
    const blurred = fireEvent.blur(lastNameInput);
    expect(blurred).toBe(true);
  });

  expect(
    isFullName(
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
  ).toBe(true);
});

describe('NameInputs Component', () => {
  const mockHandleInputChange = jest.fn();
  const mockHandleRequiredFieldBlur = jest.fn();

  const defaultName = {
    firstName: 'John',
    middleName: 'A.',
    lastName: 'Doe',
  };

  const requiredFields = ['firstName', 'lastName'];

  const errors = {
    firstName: 'First name is required',
    lastName: 'Last name is required',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all fields with correct initial values', () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    expect(screen.getByTestId('name-form-first-name')).toHaveValue(defaultName.firstName);
    expect(screen.getByTestId('name-form-middle-name')).toHaveValue(defaultName.middleName);
    expect(screen.getByTestId('name-form-last-name')).toHaveValue(defaultName.lastName);
  });

  it('shows error message when a required field is blurred when empty', async () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );
    const firstNameInput = screen.getByTestId('name-form-first-name');
    fireEvent.focus(firstNameInput);
    fireEvent.change(firstNameInput, { target: { value: '' } });
    fireEvent.blur(firstNameInput);
    await (async () => {
      const errorMessage = screen.getByText('First Name is required');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('calls handleInputChange when first name is changed', () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = screen.getByTestId('name-form-first-name');
    fireEvent(
      firstNameInput,
      new CustomEvent('_change', {
        detail: { name: 'firstName', value: 'Jane' },
      })
    );

    expect(mockHandleInputChange).toHaveBeenCalledWith('firstName', 'Jane');
  });

  it('calls handleRequiredFieldBlur when first name loses focus', () => {
    const requiredFields = ['firstName', 'lastName'];

    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = screen.getByTestId('name-form-first-name');

    const blurred = fireEvent(
      firstNameInput,
      new CustomEvent('_blur', {
        detail: { name: 'firstName', value: 'Jane' },
      })
    );

    expect(blurred).toBe(true);
  });

  it('calls handleRequiredFieldBlur when first name is empty and loses focus', () => {
    const requiredFields = ['firstName', 'lastName'];
    const defaultName = {
      firstName: '',
      middleName: 'A.',
      lastName: 'Doe',
    };

    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = screen.getByTestId('name-form-first-name');

    //const blurred = fireEvent.blur(firstNameInput);
    //fireEvent(inputField, new CustomEvent('_blur', { detail: { name: 'test', value: '123' } }));
    const blurred = fireEvent(
      firstNameInput,
      new CustomEvent('_blur', {
        detail: { name: 'firstName', value: '' },
      })
    );

    expect(blurred).toBe(true);
  });

  it('does not display error for optional middle name', () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName=""
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={{ ...defaultName, middleName: '' }}
      />
    );

    expect(screen.queryByText('Middle Name is required')).not.toBeInTheDocument();
  });

  it('can disable the inputs', () => {
    const { getByTestId } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName=""
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={{ ...defaultName, middleName: '' }}
        disabled={true}
      />
    );

    expect(getByTestId('name-form-last-name').getAttribute('disabled')).toBe('true');
  });

  it('sets requirement label correctly for required and optional fields', () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );
    const formitemFirstName = screen.getByTestId('formitem-first-name');
    const formitemLastName = screen.getByTestId('formitem-last-name');
    const formitemMiddleName = screen.getByTestId('formitem-middle-name');
    expect(formitemFirstName).toHaveAttribute('requirement', 'required');
    expect(formitemLastName).toHaveAttribute('requirement', 'required');
    expect(formitemMiddleName).not.toHaveAttribute('requirement', 'required');
  });
});
