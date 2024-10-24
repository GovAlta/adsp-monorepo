import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NameInputs } from './FullNameInputs';
import { isFullName } from './FullNameTester';

describe('NameInputs', () => {
  const mockHandleInputChange = jest.fn(() => Promise.resolve());

  const defaultName = {
    firstName: 'John',
    middleName: 'A.',
    lastName: 'Doe',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all input fields with the correct initial values', () => {
    const component = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
      />
    );

    const firstNameInput = component.getByTestId('name-form-first-name');
    expect((firstNameInput as HTMLInputElement).value).toBe(defaultName.firstName);

    const middleNameInput = component.getByTestId('name-form-middle-name');
    expect((middleNameInput as HTMLInputElement).value).toBe(defaultName.middleName);

    const lastNameInput = component.getByTestId('name-form-last-name');
    expect((lastNameInput as HTMLInputElement).value).toBe(defaultName.lastName);
  });

  it('calls handleInputChange on user input in first name', () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
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
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('firstName', 'Jane');
  });

  it('calls handleInputChange on user input in middle name', () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
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
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('middleName', 'B.');
  });

  it('calls handleInputChange on user input in last name', () => {
    render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
      />
    );

    const lastNameInput = screen.getByTestId('name-form-last-name');
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

    fireEvent(
      lastNameInput,
      new CustomEvent('_change', {
        detail: { name: 'lastName', value: 'Smith' },
      })
    );

    expect((lastNameInput as HTMLInputElement).value).toBe('Smith');
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('lastName', 'Smith');
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('test fullname tester', () => {
    expect(
      isFullName(
        {
          type: 'Category',
        },
        {},
        {}
      )
    ).toBe(false);
  });

  expect(
    isFullName(
      {
        type: 'Control',
        scope: '#/properties/personFullName',
      },
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
              },
              middleName: {
                $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                type: 'string',
                pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
              },
              lastName: {
                $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                type: 'string',
                pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
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
          },
        },
      },
      {}
    )
  ).toBe(true);
});
