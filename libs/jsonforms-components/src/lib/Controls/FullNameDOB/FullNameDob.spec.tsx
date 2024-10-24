import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullNameDobControl } from './FullNameDobControl';
import { ControlElement } from '@jsonforms/core';

describe('FullNameDobControl', () => {
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
    fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

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

  it('matches snapshot', () => {
    const { asFragment } = render(
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
    expect(asFragment()).toMatchSnapshot();
  });
});
