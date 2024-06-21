import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAInputTimeProps, GoATimeControl, GoATimeInput } from './InputTimeControl';
import { ControlElement, ControlProps } from '@jsonforms/core';

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
  };

  const handleChangeMock = jest.fn(() => Promise.resolve());

  describe('time input control tests', () => {
    it('can render time input control', () => {
      const props = { ...staticProps };
      const component = render(GoATimeInput(props));
      expect(component.getByTestId('myDateId-input')).toBeInTheDocument();
    });
    it('can trigger time onKeyPress event', async () => {
      const props = { ...staticProps };
      const component = render(GoATimeInput(props));

      const input = component.getByTestId('myDateId-input');
      const pressed = fireEvent.keyPress(input, { key: '1', code: 49, charCode: 49 });

      expect(pressed).toBe(true);
    });

    it('can trigger time onBlur event', async () => {
      const props = { ...staticProps };
      const component = render(GoATimeInput(props));
      const input = component.getByTestId('myDateId-input');
      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });

    it('can trigger time control handleChange event', async () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      const component = render(GoATimeInput(props));
      handleChangeMock();

      const input = component.getByTestId('myDateId-input');
      const pressed = fireEvent.keyPress(input, { key: '1', code: 49, charCode: 49 });

      expect(props.handleChange).toBeCalled();
      expect(pressed).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(1);
    });
  });
});
