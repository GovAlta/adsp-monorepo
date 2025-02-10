import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAInputIntegerProps, GoAInputInteger, GoAIntegerControl } from './InputIntegerControl';
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
  const staticProps: GoAInputIntegerProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {},
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'Age',
    id: 'age',
    config: {},
    path: '',
    errors: '',
    data: 'My Age',
    visible: true,
    isValid: true,
  };

  const handleChangeMock = jest.fn(() => Promise.resolve());

  describe('can create input number control', () => {
    it('can create control', () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const ageInput = baseElement.querySelector("goa-input[testId='age-input']");
      expect(ageInput).toBeInTheDocument();
    });
    it('can create base control', () => {
      const props = { ...staticProps };
      const baseControl = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAIntegerControl {...props} />
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
          <GoAInputInteger {...props} />
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
          <GoAInputInteger {...props} />
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
          <GoAInputInteger {...props} />
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
          <GoAInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='age-input']");
      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });

    it('can trigger handleChange event', async () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoAInputInteger {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='age-input']");
      const pressed = fireEvent(
        input,
        new CustomEvent('_keyPress', {
          detail: { key: 'z', code: 90, charCode: 90 },
        })
      );

      handleChangeMock();

      expect(props.handleChange).toBeCalled();
      expect(pressed).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(2);
    });
  });
});
