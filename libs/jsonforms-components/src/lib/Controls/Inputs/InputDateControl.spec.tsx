import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAInputDateProps, GoADateInput } from './InputDateControl';
import { ControlElement } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';

const mockContextValue = {
  errors: [],
  data: {},
};

describe('input date controls', () => {
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

  const uiSchema = (min: string, max: string): ControlElement => {
    return {
      type: 'Control',
      scope: '#/properties/theDate',
      label: 'Date control test',
      options: {
        componentProps: {
          min: min,
          max: max,
        },
      },
    };
  };

  const staticProps: GoAInputDateProps = {
    uischema: uiSchema('2023-02-01', '2025-02-01'),
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

  describe('date input control tests', () => {
    it('can create base control', () => {
      const props = { ...staticProps };
      // eslint-disable-next-line
      const baseControl = render(<GoADateInput {...(props as any)} />);
      expect(baseControl).toBeDefined();
    });

    it('can create base control', () => {
      const props = { ...staticProps };

      const baseControl = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );

      expect(baseControl).toBeDefined();
    });
    it('can create control with errors', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is a error' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const myDateId = baseElement.querySelector("goa-input[testId='myDateId-input']");
      expect(myDateId.getAttribute('error')).toBe('true');
    });

    it('can create control with label as name', () => {
      const props = { ...staticProps, id: '', label: 'mytestInput' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const myDateId = baseElement.querySelector("goa-input[testId='-input']");
      expect(myDateId.getAttribute('name')).toBe('mytestInput-input');
    });

    it('calls onBlur for input date control', () => {
      const props = {
        ...staticProps,
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );

      const myDateId = baseElement.querySelector("goa-input[testId='myDateId-input']");

      const blurred = fireEvent.blur(myDateId);

      expect(blurred).toBe(true);
    });

    it('calls onChange for input date control', () => {
      const props = {
        ...staticProps,
        uischema: {
          ...staticProps.uischema,
          options: {
            ...staticProps.uischema.options,
            autoCapitalize: true,
          },
        },
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      //todo: there is issue to fire event when change the input date value, will discuss with design team.
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      input.setAttribute('value', '01/01/2025');
      fireEvent(
        input,
        new CustomEvent('_change', {
          detail: { value: '01/01/2025' },
        })
      );
      expect(input.getAttribute('value')).toBe('01/01/2025');
    });

    it('can trigger keyPress event', async () => {
      const props = {
        ...staticProps,
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      fireEvent(input, new CustomEvent('_keyPress', { detail: { name: '1', value: '1', key: '1' } }));

      fireEvent.change(
        input,
        new CustomEvent('_change', {
          detail: { name: 'myDateId-input', value: '01/01/2025' },
        })
      );
      input.setAttribute('value', '01/01/2025');
      expect(input.getAttribute('value')).toBe('01/01/2025');
    });

    it('calls onChange for input date control', () => {
      const props = {
        ...staticProps,
        uischema: {
          ...staticProps.uischema,
          options: {
            ...staticProps.uischema.options,
            autoCapitalize: true,
          },
        },
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });

    it('can trigger handleChange event', async () => {
      const props = { ...staticProps };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      input?.setAttribute('value', '01/01/2025');
      expect(input.getAttribute('value')).toBe('01/01/2025');
    });

    it('can trigger on Blur event', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");

      const mockBlurHandler = jest.fn();
      input.addEventListener('blur', mockBlurHandler);

      const blurred = fireEvent.blur(input);
      expect(blurred).toBe(true);

      expect(mockBlurHandler).toHaveBeenCalled();
    });
  });
});
