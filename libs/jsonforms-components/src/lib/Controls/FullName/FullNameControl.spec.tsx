import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NameInputs } from './FullNameInputs';
import { FullNameControl, FullNameReviewControl } from './FullNameControl';
import { ControlProps } from '@jsonforms/core';

describe('FullNameControl', () => {
  const mockHandleChange = jest.fn();

  const defaultProps: ControlProps = {
    data: {
      firstName: 'John',
      middleName: 'A.',
      lastName: 'Doe',
    },
    path: 'path-to-data',
    schema: { required: ['firstName', 'lastName'] },
    handleChange: mockHandleChange,
    label: '',
    uischema: {
      type: 'Control',
      scope: '',
    },
    errors: '',
    rootSchema: {},
    id: '',
    enabled: false,
    visible: false,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the FullNameControl component with the correct initial values', async () => {
    const { baseElement } = render(<FullNameControl {...defaultProps} />);
    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    const middleNameInput = baseElement.querySelector("goa-input[testId='name-form-middle-name']");

    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-last-name']");
    await (async () => {
      expect(firstNameInput?.getAttribute('value')).toBe('John');
      expect(middleNameInput?.getAttribute('value')).toBe('A.');
      expect(lastNameInput?.getAttribute('value')).toBe('Doe');
    });
  });

  it('calls handleChange when user inputs a new first name', async () => {
    const { baseElement } = render(<FullNameControl {...defaultProps} />);
    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");

    fireEvent(
      firstNameInput,
      new CustomEvent('_keyPress', {
        detail: { name: 'firstName', value: 'Jane', key: 'e' },
      })
    );
    fireEvent(
      firstNameInput,
      new CustomEvent('_change', {
        detail: { name: 'firstName', value: 'Jane' },
      })
    );

    await (async () => {
      expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
        firstName: 'Jane',
        middleName: 'A.',
        lastName: 'Doe',
      });
    });
  });
  it('shows error message when a required field is blurred when empty', async () => {
    const { baseElement } = render(<FullNameControl {...defaultProps} />);

    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");
    fireEvent.focus(firstNameInput);
    fireEvent(firstNameInput, new CustomEvent('_change', { detail: { value: '' } }));
    fireEvent.blur(firstNameInput);
    await (async () => {
      const errorMessage = screen.getByText('First name is required');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('first name field is changed when key pressed with no errors.', async () => {
    const { baseElement } = render(<FullNameControl {...defaultProps} />);
    const firstNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");

    fireEvent(
      firstNameInput,
      new CustomEvent('_keyPress', {
        detail: { name: 'firstName', value: 'Jane', key: 'e' },
      })
    );
    fireEvent(
      firstNameInput,
      new CustomEvent('_change', {
        detail: { name: 'firstName', value: 'Jane' },
      })
    );

    await (async () => {
      const errorMessage = screen.getByText('First name is required');
      expect(errorMessage).not.toBeInTheDocument();
    });
  });

  it('calls handleChange when user inputs a new last name', async () => {
    const { baseElement } = render(<FullNameControl {...defaultProps} />);
    const lastNameInput = baseElement.querySelector("goa-input[testId='name-form-first-name']");

    fireEvent(
      lastNameInput,
      new CustomEvent('_change', {
        detail: { name: 'lastName', value: 'Smith' },
      })
    );

    await (async () => {
      expect(mockHandleChange).toHaveBeenCalledWith('path-to-data', {
        firstName: 'John',
        middleName: 'A.',
        lastName: 'Smith',
      });
    });
  });
});

describe('FullNameReviewControl', () => {
  const defaultReviewProps: ControlProps = {
    data: {
      firstName: 'John',
      middleName: 'A.',
      lastName: 'Doe',
    },
    id: 'full-name-review',
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

  it('renders the FullNameReviewControl component with correct data', async () => {
    render(<FullNameReviewControl {...defaultReviewProps} />);

    const firstNameReview = screen.getByTestId('firstName-control-full-name-review');
    const middleNameReview = screen.getByTestId('middleName-control-full-name-review');
    const lastNameReview = screen.getByTestId('lastName-control-full-name-review');
    await (async () => {
      expect(firstNameReview).toHaveTextContent('John');
      expect(middleNameReview).toHaveTextContent('A.');
      expect(lastNameReview).toHaveTextContent('Doe');
    });
  });

  it('renders empty values when no data is provided', async () => {
    const defaultProps: ControlProps = {
      data: {
        firstName: '',
        middleName: '',
        lastName: '',
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
      id: 'full-name-review-empty',
      enabled: false,
      visible: false,
    };
    render(<FullNameReviewControl {...defaultProps} />);

    const firstNameReview = screen.getByTestId('firstName-control-full-name-review-empty');
    const middleNameReview = screen.getByTestId('middleName-control-full-name-review-empty');
    const lastNameReview = screen.getByTestId('lastName-control-full-name-review-empty');
    await (async () => {
      expect(firstNameReview).toHaveValue('');
      expect(middleNameReview).toHaveValue('');
      expect(lastNameReview).toHaveValue('');
    });
  });
});
