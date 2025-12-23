import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoADateTimeControl, GoabInputDateTimeProps, GoADateTimeInput } from './InputDateTimeControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';

const mockContextValue = {
  errors: [],
  data: {},
};

describe('input date time controls', () => {
  const theDate = {
    theDate: '',
  };

  const dateSchema = {
    type: 'object',
    properties: {
      theDate: {
        type: 'string',
        format: 'date',
      },
    },
  };

  const uiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/theDate',
    label: 'Date control test',
  };

  const staticProps: GoabInputDateTimeProps = {
    uischema: uiSchema,
    schema: dateSchema,
    rootSchema: dateSchema,
    handleChange: (path, value) => {},
    enabled: true,
    label: 'Date control test',
    id: 'myDateId',
    config: {},
    path: '',
    errors: '',
    data: theDate.theDate,
    visible: true,
    isValid: true,
    isVisited: false,
    setIsVisited: () => {},
  };

  describe('date time input control tests', () => {
    it('can render date input control', () => {
      const props = { ...staticProps, uischema: uiSchema };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const myDateId = baseElement.querySelector("goa-input[testId='myDateId-input']");

      expect(myDateId).toBeInTheDocument();
    });

    it('can create base control', () => {
      const props = { ...staticProps };
      const baseControl = render(GoADateTimeControl(props as ControlProps));
      expect(baseControl).toBeDefined();
    });

    it('can create control with errors', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is a error' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      expect(input.getAttribute('error')).toBe('true');
    });

    it('can create control with label as name', () => {
      const props = { ...staticProps, id: '', label: 'mytestInput' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='-input']");

      expect(input.getAttribute('name')).toBe('mytestInput-input');
    });

    it('can create control with data', () => {
      const props = { ...staticProps, data: '01/01/2025 01:01:00 AM' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");

      expect(input.getAttribute('value')).toBe('2025-01-01');
    });

    it('can trigger keyPress event', async () => {
      const props = { ...staticProps, uischema: uiSchema };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );

      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      const pressed = fireEvent(input, new CustomEvent('_keyPress', { detail: { key: '1', code: 49, charCode: 49 } }));

      expect(pressed).toBe(true);
      expect(input).toBeInTheDocument();
    });

    it('can trigger on Blur event', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });

    it('calls onChange for input datetime control', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );

      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");

      fireEvent(
        input,
        new CustomEvent('_change', {
          detail: { name: 'myDateId', value: '01/01/2025' },
        })
      );
      input?.setAttribute('value', '01/01/2025');
      expect(input?.getAttribute('value')).toBe('01/01/2025');
    });
  });
});
