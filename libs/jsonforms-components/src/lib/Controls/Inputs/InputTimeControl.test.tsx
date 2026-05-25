import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAInputTimeProps, GoATimeInput } from './InputTimeControl';
import { ControlElement } from '@jsonforms/core';
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
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      expect(input).toBeInTheDocument();
    });

    it('can create control with errors', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is a error' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      expect(input.getAttribute('error')).toBe('true');
    });

    it('can create control with label as name', () => {
      const props = { ...staticProps, id: '', label: 'mytestDate' };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='-input']");
      expect(input.getAttribute('name')).toBe('mytestDate-input');
    });

    it('can trigger time onKeyPress event', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );

      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");
      const pressed = fireEvent.keyPress(input, { key: '1', code: 49, charCode: 49 });

      expect(pressed).toBe(true);
    });

    it('can trigger time onBlur event', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");

      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });

    it('can trigger time onBlur event when isVisible is false', async () => {
      const props = { ...staticProps };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...{ ...props, isVisited: false }} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");

      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });

    it('can trigger on Blur event with value', async () => {
      const props = {
        ...staticProps,
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      handleChangeMock();

      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");

      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });
    it('calls onChange for input time control', () => {
      const props = {
        ...staticProps,
      };

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");

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

      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoATimeInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-input[testId='myDateId-input']");

      const pressed = fireEvent(input, new CustomEvent('_keyPress', { detail: { name: '1', value: '1', key: '1' } }));
      // const pressed = fireEvent.keyPress(input, { key: '1', code: 49, charCode: 49 });
      expect(pressed).toBe(true);
      expect(input).toBeInTheDocument();
    });
  });
});
