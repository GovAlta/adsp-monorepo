import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { GoAInputText, formatSin, GoATextControl } from './InputTextControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';

import { validateSinWithLuhn, checkFieldValidity, isValidDate } from '../../util/stringUtils';
import { GoANumberInput } from './InputNumberControl';

const mockContextValue = {
  errors: [],
  data: {},
};

//eslint-disable-next-line
const TestComponent: React.FC<{ props: any }> = ({ props }) => {
  const ctx = React.useContext(JsonFormsContext);
  return <>{checkFieldValidity(props)}</>;
};

interface ControlElementWithMin extends ControlElement {
  minLength: number;
}

describe('Input Text Control tests', () => {
  const textBoxUiSchema: ControlElementWithMin = {
    type: 'Control',
    scope: '#/properties/amount',
    label: 'Amount',
    minLength: 1,
  };

  const staticProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {
      multipleOf: 1,
      minimum: 1,
      exclusiveMaximum: 5000,
    },
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'Amount',
    id: 'amount',
    config: {},
    path: '',
    errors: '',
    data: '1',
    visible: true,
    isValid: true,
    required: false,
    isVisited: false,
    setIsVisited: () => {},
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
    it('calls onBlur for input numeric control', () => {
      const props = {
        ...staticProps,
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>
      );
      const amountInput = baseElement.querySelector("goa-input[testId='amount-input']");

      const blurred = fireEvent.blur(amountInput);

      expect(blurred).toBe(true);
    });

    it('can create control', () => {
      const props = { ...staticProps };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>
      );
      const amountInput = baseElement.querySelector("goa-input[testId='amount-input']");

      expect(amountInput).toBeInTheDocument();
    });

    it('can create input control with errors', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is an error' };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoANumberInput {...props} />
        </JsonFormsContext.Provider>
      );
      const amountInput = baseElement.querySelector("goa-input[testId='amount-input']");
      expect(amountInput.getAttribute('error')).toBe('true');
    });

    it('can create control with label as name', () => {
      const props = { ...staticProps, id: '', label: 'mytestInput' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoANumberInput {...props} />
        </JsonFormsContext.Provider>
      );
      const amountInput = baseElement.querySelector("goa-input[testId='-input']");
      expect(amountInput.getAttribute('name')).toBe('mytestInput-input');
    });
    it('can create input control with undefined data', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is an error', data: undefined };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoANumberInput {...props} />
        </JsonFormsContext.Provider>
      );
      const amountInput = baseElement.querySelector("goa-input[testId='amount-input']");
      expect(amountInput).toBeInTheDocument();
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
      const amountInput = baseElement.querySelector("goa-input[testId='amount-input']");

      const pressed = fireEvent.keyPress(amountInput, { key: 'z', code: 90, charCode: 90 });
      expect(pressed).toBe(true);
      expect(amountInput).toBeInTheDocument();
    });

    it('can trigger onChange  event', async () => {
      const props = { ...staticProps };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoANumberInput {...props} />
        </JsonFormsContext.Provider>
      );
      const amountInput = baseElement.querySelector("goa-input[testId='amount-input']");
      // fireEvent.change(amountInput, { target: { value: '5' } });

      fireEvent(
        amountInput,
        new CustomEvent('_change', {
          detail: { name: 'amount', value: '5' },
        })
      );
      amountInput?.setAttribute('value', '5');
      expect(amountInput?.getAttribute('value')).toBe('5');
    });

    it('can trigger on Blur event', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoANumberInput {...props} />
        </JsonFormsContext.Provider>
      );

      const firstNameInput = baseElement.querySelector("goa-input[testId='amount-input']");

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
      expect(handleChangeMock).toHaveBeenCalledWith('', '123 456 789');
    });

    it('can trigger handleChange event', async () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputText {...props} />
        </JsonFormsContext.Provider>
      );
      const firstNameInput = baseElement.querySelector("goa-input[testId='amount-input']");

      //const pressed = fireEvent.keyPress(firstNameInput, { key: 'z', code: 90, charCode: 90 });
      const pressed = await fireEvent(
        firstNameInput,
        new CustomEvent('_keypress', { key: 'z', code: 90, charCode: 90 })
      );

      handleChangeMock();
      expect(props.handleChange).toBeCalled();
      expect(pressed).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(2);
    });
  });

  describe('Control Types tests', () => {
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
