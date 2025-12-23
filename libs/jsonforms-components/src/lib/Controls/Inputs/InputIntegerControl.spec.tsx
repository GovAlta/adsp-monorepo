import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoabInputIntegerProps, GoabInputInteger } from './InputIntegerControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';

const mockContextValue = {
  errors: [],
  data: {},
};

describe('input number controls', () => {
  const textBoxUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/age',
    label: 'Age',
  };

  const regExNumbers = new RegExp('^\\d+$');
  const staticProps: GoabInputIntegerProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {
      multipleOf: 1,
      minimum: 1,
      exclusiveMaximum: 5000,
    },
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'Age',
    id: 'age',
    config: {},
    path: '',
    errors: '',
    data: '10',
    visible: true,
    isValid: true,
    isVisited: false,
    setIsVisited: () => {},
  };

  describe('can create input number control', () => {
    it('can create control', () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const ageInput = baseElement.querySelector("goa-input[testId='age-input']");
      expect(ageInput).toBeInTheDocument();
    });
    it('can create control with errors', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is a error' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const ageInput = baseElement.querySelector("goa-input[testId='age-input']");
      expect(ageInput).toBeInTheDocument();
    });
    it('can create control with undefined data', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is a error', data: undefined };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const ageInput = baseElement.querySelector("goa-input[testId='age-input']");
      expect(ageInput).toBeInTheDocument();
    });

    it('can create control with label as name', () => {
      const props = { ...staticProps, id: '', label: 'mytestInput' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const ageInput = baseElement.querySelector("goa-input[testId='-input']");
      expect(ageInput.getAttribute('name')).toBe('mytestInput-input');
    });

    it('can create base control', () => {
      const props = { ...staticProps };
      const baseControl = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      expect(baseControl).toBeDefined();
    });
  });

  describe('can trigger input events', () => {
    it('can trigger keyPress event', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='age-input']");

      const pressed = fireEvent(
        input,
        new CustomEvent('_keyPress', {
          detail: { key: '1', code: 49, charCode: 49 },
        })
      );

      expect(pressed).toBe(true);
    });

    it('can trigger keyPress with non numeric values', () => {
      const nonNumericValue = 'z';
      const props = { ...staticProps, data: nonNumericValue };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='age-input']");
      const pressed = fireEvent(
        input,
        new CustomEvent('_keyPress', {
          detail: { key: nonNumericValue, code: 90, charCode: 90 },
        })
      );

      expect(pressed).toBe(true);
      expect(props.data).not.toMatch(regExNumbers);
    });

    it('can trigger keyPress with numeric values', () => {
      const numericValue = '1';
      const props = { ...staticProps, data: numericValue };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );

      const input = baseElement.querySelector("goa-input[testId='age-input']");
      const pressed = fireEvent(
        input,
        new CustomEvent('_keyPress', {
          detail: { key: numericValue, code: 49, charCode: 49 },
        })
      );
      expect(pressed).toBe(true);
      expect(props.data).toMatch(regExNumbers);
    });

    it('can trigger on Blur event', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='age-input']");
      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });

    it('calls onChange for input text control', () => {
      const props = {
        ...staticProps,
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoabInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='age-input']");
      const pressed = fireEvent(
        input,
        new CustomEvent('_keyPress', {
          detail: { key: 'z', code: 90, charCode: 90 },
        })
      );
      //  const input = component.getByTestId('age-input');
      //  fireEvent.change(input, { target: { value: '10' } });

      fireEvent(
        input,
        new CustomEvent('_change', {
          detail: { name: 'input', value: '10' },
        })
      );
      expect(input?.getAttribute('value')).toBe('10');
    });
  });
});
