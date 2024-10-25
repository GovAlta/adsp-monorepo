import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NameInputs } from './FullNameInputs';

describe('NameInputs', () => {
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
    await (async () => {
      expect(mockHandleInputChange).toHaveBeenCalledTimes(1);
      expect(mockHandleInputChange).toHaveBeenCalledWith('firstName', 'John');
      expect((firstNameInput as HTMLInputElement).value).toBe('John');
    });
  });

  it('shows required error when first name is missing and blurred', async () => {
    render(
      <NameInputs
        firstName=""
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={{ ...defaultName, firstName: '' }}
      />
    );

    const firstNameInput = screen.getByTestId('name-form-first-name');
    fireEvent.blur(firstNameInput);
    await (async () => {
      expect(handleBlur).toHaveBeenCalledTimes(1);
      const error = await screen.getByText('firstName is required');
      expect(error).toBeInTheDocument();
    });
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
    fireEvent.blur(lastNameInput);
    await (async () => {
      expect(handleBlur).toHaveBeenCalled();
      const error = await screen.getByText('lastName is required');
      expect(error).toBeInTheDocument();
    });
  });

  it('matches snapshot', () => {
    const { asFragment } = render(
      <NameInputs
        firstName={defaultName.firstName}
        middleName={defaultName.middleName}
        lastName={defaultName.lastName}
        handleInputChange={mockHandleInputChange}
        requiredFields={requiredFields}
        data={defaultName}
      />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
function mockHandleChange(path: string, value: string): void {
  throw new Error('Function not implemented.');
}
