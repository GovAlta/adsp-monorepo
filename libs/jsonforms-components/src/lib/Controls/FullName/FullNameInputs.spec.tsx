import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NameInputs } from './FullNameInputs';

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
});
