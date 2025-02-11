import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoADateTimeControl, GoAInputDateTimeProps, GoADateTimeInput } from './InputDateTimeControl';
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

  const staticProps: GoAInputDateTimeProps = {
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

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      expect(component.getByTestId('myDateId-input')).toBeInTheDocument();
    });

    it('can create base control', () => {
      const props = { ...staticProps };
      const baseControl = render(GoADateTimeControl(props as ControlProps));
      expect(baseControl).toBeDefined();
    });

    it('can create control with errors', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is a error' };
      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      expect(component.getByTestId('myDateId-input').getAttribute('error')).toBe('true');
    });

    it('can trigger keyPress event', async () => {
      const props = { ...staticProps, uischema: uiSchema };

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );

      const input = component.getByTestId('myDateId-input');
      const pressed = fireEvent.keyPress(input, { key: '1', code: 49, charCode: 49 });

      expect(pressed).toBe(true);
    });

    it('can trigger on Blur event', async () => {
      const props = {
        ...staticProps,
      };

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
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

    it('calls onChange for input datetime control', () => {
      const props = {
        ...staticProps,
      };

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
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
      const props = { ...staticProps };

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateTimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = component.getByTestId('myDateId-input');
      fireEvent(input, new CustomEvent('_keyPress', { detail: { name: '1', value: '1', key: '1' } }));
      const pressed = fireEvent.keyPress(input, { key: '1', code: 49, charCode: 49 });
      expect(pressed).toBe(true);
      expect(component.getByTestId('myDateId-input')).toBeInTheDocument();
    });
  });
});
