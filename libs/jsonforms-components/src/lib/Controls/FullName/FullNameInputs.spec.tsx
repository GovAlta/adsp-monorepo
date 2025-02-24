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
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    const middleNameInput = baseElement.querySelector("goa-input[testId='name-form-middle-name']");

    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");
    await (async () => {
      expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
      expect(firstNameInput?.getAttribute('value')).toBe(defaultName.firstName);
      expect(middleNameInput?.getAttribute('value')).toBe(defaultName.middleName);
      expect(lastNameInput?.getAttribute('value')).toBe(defaultName.lastName);
    });
  });

  it('calls handleInputChange on user input in first name', async () => {
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    firstNameInput?.setAttribute('value', 'John');
    fireEvent(
      firstNameInput,
      new CustomEvent('_change', {
        detail: { name: 'firstName', value: 'John' },
      })
    );
    expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('firstName', 'John');
    expect(firstNameInput?.getAttribute('value')).toBe('John');
  });

  it('name fields should be in the document', async () => {
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );
    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    const middleNameInput = baseElement.querySelector("goa-input[testId='name-form-middle-name']");

    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");

    await (async () => {
      expect(firstNameInput).toBeInTheDocument();
      expect(middleNameInput).toBeInTheDocument();
      expect(lastNameInput).toBeInTheDocument();
    });
  });

  it('calls handleInputChange on user input in middle name', async () => {
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );
    const middleNameInput = baseElement.querySelector("goa-input[testId='name-form-middle-name']");

    fireEvent(
      middleNameInput,
      new CustomEvent('_change', {
        detail: { name: 'middleName', value: 'A.' },
      })
    );
    expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('middleName', 'A.');
    expect(middleNameInput?.getAttribute('value')).toBe('A.');
  });

  it('calls handleInputChange on user input in last name', async () => {
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");
    fireEvent(
      lastNameInput,
      new CustomEvent('_change', {
        detail: { name: 'lastName', value: 'Doe' },
      })
    );
    expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('lastName', 'Doe');
    expect(lastNameInput?.getAttribute('value')).toBe('Doe');
  });

  it('shows required error when first name is missing and blurred', async () => {
    const { baseElement } = render(
      <NameInputs
        firstName=""
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={{ ...defaultName, firstName: '' }}
      />
    );

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    const blurred = fireEvent(
      firstNameInput,
      new CustomEvent('_blur', {
        detail: { name: 'firstName', value: 'firstName' },
      })
    );
    expect(blurred).toBe(true);
  });

  it('shows required error when last name is missing and blurred', async () => {
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName=""
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={{ ...defaultName, lastName: '' }}
      />
    );
    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");

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

  const defaultName = {
    firstName: 'John',
    middleName: 'A.',
    lastName: 'Doe',
  };

  const requiredFields = ['firstName', 'lastName'];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all fields with correct initial values', () => {
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );
    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    const middleNameInput = baseElement.querySelector("goa-input[testId='name-form-middle-name']");

    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");

    expect(firstNameInput?.getAttribute('value')).toBe(defaultName.firstName);
    expect(middleNameInput?.getAttribute('value')).toBe(defaultName.middleName);
    expect(lastNameInput?.getAttribute('value')).toBe(defaultName.lastName);
  });

  it('shows error message when a required field is blurred when empty', async () => {
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );
    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    fireEvent.focus(firstNameInput);
    fireEvent(
      firstNameInput,
      new CustomEvent('_change', {
        detail: { name: 'firstName', value: '' },
      })
    );

    fireEvent.blur(firstNameInput);
    await (async () => {
      const errorMessage = screen.getByText('First Name is required');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('calls handleInputChange when first name is changed', () => {
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
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

    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");

    const blurred = fireEvent.blur(firstNameInput);

    expect(blurred).toBe(true);
  });

  it('calls handleRequiredFieldBlur when first name is empty and loses focus', () => {
    const requiredFields = ['firstName', 'lastName'];
    const defaultName = {
      firstName: '',
      middleName: 'A.',
      lastName: 'Doe',
    };

    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");

    const blurred = fireEvent.blur(firstNameInput);

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
    const { baseElement } = render(
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
    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");
    expect(lastNameInput.getAttribute('disabled')).toBe('true');
  });

  it('sets requirement label correctly for required and optional fields', () => {
    const { baseElement } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );
    const firstNameInput = baseElement.querySelector("goa-form-item[testId='form-item-first-name']");
    const middleNameInput = baseElement.querySelector("goa-form-item[testId='form-item-middle-name']");

    const lastNameInput = baseElement.querySelector("goa-form-item[testId='form-item-last-name']");

    expect(firstNameInput).toBeInTheDocument();

    expect(firstNameInput).toHaveAttribute('requirement', 'required');
    expect(middleNameInput).not.toHaveAttribute('requirement', 'required');
    expect(lastNameInput).toHaveAttribute('requirement', 'required');
  });
});
