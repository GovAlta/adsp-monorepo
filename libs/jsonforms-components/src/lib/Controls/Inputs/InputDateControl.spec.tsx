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
      const baseControl = render(GoADateInput(props));
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
      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      expect(component.getByTestId('myDateId-input').getAttribute('error')).toBe('true');
    });

    it('calls onBlur for input date control', () => {
      const props = {
        ...staticProps,
      };

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = component.getByTestId('myDateId-input');
      const blurred = fireEvent(
        input,
        new CustomEvent('_blur', {
          detail: { name: 'myDateId', value: '' },
        })
      );

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

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = component.getByTestId('myDateId-input');
      fireEvent.change(input, { target: { value: '01/01/2025' } });

      fireEvent(
        input,
        new CustomEvent('_change', {
          detail: { name: 'myDateId', value: '01/01/2025' },
        })
      );
      expect((input as HTMLInputElement).value).toBe('01/01/2025');
    });

    it('can trigger keyPress event', async () => {
      const props = {
        ...staticProps,
      };

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = component.getByTestId('myDateId-input');

      const keyPressed = fireEvent.keyPress(input, { key: '1', code: 49 });

      fireEvent(input, new CustomEvent('_keyPress', { detail: { name: '1', value: '1', key: '1' } }));

      fireEvent(
        input,
        new CustomEvent('_change', {
          detail: { name: 'myDateId-input', value: '01/01/2025' },
        })
      );
      console.log('first', (input as HTMLInputElement).outerHTML);
      // expect((input as HTMLInputElement).value).toBe('01/01/2025');
    });

    it('can trigger on Blur event', async () => {
      const props = { ...staticProps };
      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = component.getByTestId('myDateId-input');
      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });
  });
});
