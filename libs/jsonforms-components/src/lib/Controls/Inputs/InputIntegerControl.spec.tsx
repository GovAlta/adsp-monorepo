import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAInputIntegerProps, GoAInputInteger, GoAIntegerControl } from './InputIntegerControl';
import { ControlElement, ControlProps } from '@jsonforms/core';

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
      const component = render(GoAInputInteger(props));
      expect(component.getByTestId('age-input')).toBeInTheDocument();
    });
    it('can create base control', () => {
      const props = { ...staticProps };
      const baseControl = render(GoAIntegerControl(props));
      expect(baseControl).toBeDefined();
    });
  });

  describe('can trigger input events', () => {
    it('can trigger keyPress event', async () => {
      const props = { ...staticProps };
      const component = render(GoAInputInteger(props));

      const input = component.getByTestId('age-input');
      const pressed = fireEvent.keyPress(input, { key: '1', code: 49, charCode: 49 });

      expect(pressed).toBe(true);
    });

    it('can trigger keyPress with non numeric values', () => {
      const nonNumericValue = 'z';
      const props = { ...staticProps, data: nonNumericValue };
      const component = render(GoAInputInteger(props));
      const input = component.getByTestId('age-input');
      const pressed = fireEvent.keyPress(input, { key: nonNumericValue, code: 90, charCode: 90 });

      expect(pressed).toBe(true);
      expect(props.data).not.toMatch(regExNumbers);
    });

    it('can trigger keyPress with numeric values', () => {
      const numericValue = '1';
      const props = { ...staticProps, data: numericValue };
      const component = render(GoAInputInteger(props));
      const input = component.getByTestId('age-input');
      const pressed = fireEvent.keyPress(input, { key: numericValue, code: 49, charCode: 49 });

      expect(pressed).toBe(true);
      expect(props.data).toMatch(regExNumbers);
    });

    it('can trigger on Blur event', async () => {
      const props = { ...staticProps };
      const component = render(GoAInputInteger(props));
      const input = component.getByTestId('age-input');
      const blurred = fireEvent.blur(input);

      expect(blurred).toBe(true);
    });

    it('can trigger handleChange event', async () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      const component = render(GoAInputInteger(props));
      const input = component.getByTestId('age-input');
      const pressed = fireEvent.keyPress(input, { key: 'z', code: 90, charCode: 90 });

      handleChangeMock();

      expect(props.handleChange).toBeCalled();
      expect(pressed).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(1);
    });
  });
});
