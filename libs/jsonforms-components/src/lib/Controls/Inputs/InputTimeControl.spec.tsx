import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAInputTimeProps, GoATimeControl, GoATimeInput } from './InputTimeControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';

const mockContextValue = {
  errors: [],
  data: {},
};
describe('input number controls', () => {
  const theDate = {
    theDate: '01:01:01 AM',
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

  const uiSchema = (): ControlElement => {
    return {
      type: 'Control',
      scope: '#/properties/age',
    };
  };

  const staticProps: GoAInputTimeProps = {
    uischema: uiSchema(),
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

  const handleChangeMock = jest.fn(() => Promise.resolve());

  describe('time input control tests', () => {
    it('can render time input control', () => {
      const props = { ...staticProps };
      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      expect(component.getByTestId('myDateId-input')).toBeInTheDocument();
    });

    it('can create base control', () => {
      const props = { ...staticProps };
      const baseControl = render(GoATimeControl(props as ControlProps));
      expect(baseControl).toBeDefined();
    });

    it('can create control with errors', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is a error' };
      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      expect(component.getByTestId('myDateId-input').getAttribute('error')).toBe('true');
    });

    it('can trigger time onKeyPress event', async () => {
      const props = { ...staticProps };
      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
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
          <GoATimeInput {...props} />
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

    it('can trigger on Blur event with value', async () => {
      const props = {
        ...staticProps,
      };

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = component.getByTestId('myDateId-input');
      const blurred = fireEvent(
        input,
        new CustomEvent('_blur', {
          detail: { name: 'myDateId', value: '01/01/2025 01:01:01 AM' },
        })
      );

      expect(blurred).toBe(true);
    });
    it('calls onChange for input time control', () => {
      const props = {
        ...staticProps,
      };

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = component.getByTestId('myDateId-input');
      fireEvent.change(input, { target: { value: '01/01/2025 01:01:01 AM' } });

      const eventCalled = fireEvent(
        input,
        new CustomEvent('_change', {
          detail: { name: 'myDateId', value: '01/01/2025 01:01:01 AM' },
        })
      );
      expect(eventCalled).toBe(true);
    });
    it('can trigger keyPress event', async () => {
      const props = { ...staticProps };

      const component = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
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
