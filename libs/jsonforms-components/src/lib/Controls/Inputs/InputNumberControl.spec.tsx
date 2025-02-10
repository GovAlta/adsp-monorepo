import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { GoAInputTextProps, GoAInputText, GoATextControl, formatSin } from './InputTextControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';

import { validateSinWithLuhn, checkFieldValidity, isValidDate } from '../../util/stringUtils';

const mockContextValue = {
  errors: [],
  data: {},
};

//eslint-disable-next-line
const TestComponent: React.FC<{ props: any }> = ({ props }) => {
  const ctx = React.useContext(JsonFormsContext);
  return <>{checkFieldValidity(props, ctx)}</>;
};

describe('Input Text Control tests', () => {
  const textBoxUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/firstName',
    label: 'My First name',
  };

  const staticProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {},
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: '',
    errors: '',
    data: 'My Name',
    visible: true,
    isValid: true,
    required: false,
  };
  const sinProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: { title: 'Social insurance number', errorMessage: 'Must be three groups of three digits.' },
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: '',
    errors: '',
    data: '1324567',
    visible: true,
    isValid: true,
    required: false,
  };
  const invalidSinProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: { title: 'Social insurance number', errorMessage: 'Please enter valid SIN' },
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: '',
    errors: '',
    data: '132 456 789',
    visible: true,
    isValid: true,
    required: false,
  };
  const emptyBooleanProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: { type: 'boolean' },
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: '',
    errors: '',
    data: null,
    visible: true,
    isValid: true,
    required: true,
  };

  const handleChangeMock = jest.fn(() => Promise.resolve());

  describe('can create control', () => {
    it('can create control', () => {
      const props = { ...staticProps };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      expect(firstNameInput).toBeInTheDocument();
    });

    it('can create base control', () => {
      const props = { ...staticProps };
      const baseControl = render(GoATextControl(props));
      expect(baseControl).toBeDefined();
    });
  });

  describe('text control events', () => {
    it('can trigger keyPress event', async () => {
      const props = { ...staticProps };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      const pressed = fireEvent.keyPress(firstNameInput, { key: 'z', code: 90, charCode: 90 });
      expect(pressed).toBe(true);
      expect(firstNameInput).toBeInTheDocument();
    });

    it('can trigger on Blur event', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>
      );

      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      const blurred = fireEvent.blur(firstNameInput);
      expect(blurred).toBe(true);
    });

    it('should format sin', async () => {
      const props = { ...sinProps, handleChange: handleChangeMock };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      await fireEvent(
        firstNameInput,
        new CustomEvent('_change', {
          detail: { value: '123456789' },
        })
      );
      // await fireEvent.change(input, { target: { value: '123456789' } });
      expect(handleChangeMock).toHaveBeenCalledWith('', '123 456 789');
    });

    it('can trigger handleChange event', async () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='firstName-input']");

      const pressed = fireEvent.keyPress(firstNameInput, { key: 'z', code: 90, charCode: 90 });

      handleChangeMock();
      expect(props.handleChange).toBeCalled();
      expect(pressed).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(2);
    });
  });

  describe('Control Types test', () => {
    it('Empty Boolean control should show error', () => {
      const { getByText } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <TestComponent props={emptyBooleanProps} />
        </JsonFormsContext.Provider>
      );

      expect(getByText('First name is required')).toBeTruthy();
    });
    it('Check if the date is a valid date/time', () => {
      const date = new Date();
      expect(isValidDate(date)).toBe(true);
    });
    it('Check the date is a invalid', () => {
      expect(isValidDate('')).toBe(false);
    });
  });
  describe('Luhn validation function tests', () => {
    it('Must be three groups of three digits', () => {
      const { getByText } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <TestComponent props={sinProps} />
        </JsonFormsContext.Provider>
      );
      expect(getByText('Must be three groups of three digits.')).toBeTruthy();
    });

    it('should enter valid SIN', () => {
      const { getByText } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <TestComponent props={invalidSinProps} />
        </JsonFormsContext.Provider>
      );
      expect(getByText('Social insurance number is invalid')).toBeTruthy();
    });
    it('should return true for valid SIN Number', () => {
      expect(validateSinWithLuhn(Number('046454286'))).toBe(true);
    });

    it('should return false for invalid SIN Number', () => {
      expect(validateSinWithLuhn(Number('123456879'))).toBe(false);
    });
    it('should return 9 digits for invalid SIN Number with more than 16 digits', () => {
      expect(formatSin('123456879123456789999')).toBe('123 456 879');
    });
  });

  describe('formatSin', () => {
    it('formats a valid SIN number correctly', () => {
      const input = '123456789';
      const expected = '123 456 789';
      expect(formatSin(input)).toBe(expected);
    });

    it('handles input with existing spaces correctly', () => {
      const input = '123 456 789';
      const expected = '123 456 789';
      expect(formatSin(input)).toBe(expected);
    });

    it('removes non-numeric characters and formats correctly', () => {
      const input = 'abc123456def';
      const expected = '123 456';
      expect(formatSin(input)).toBe(expected);
    });

    it('truncates input longer than 9 digits', () => {
      const input = '123456789012345';
      const expected = '123 456 789';
      expect(formatSin(input)).toBe(expected);
    });

    it('formats input with fewer than 9 digits', () => {
      const input = '12345';
      const expected = '123 45';
      expect(formatSin(input)).toBe(expected);
    });

    it('returns an empty string for empty input', () => {
      const input = '';
      const expected = '';
      expect(formatSin(input)).toBe(expected);
    });
  });
});
