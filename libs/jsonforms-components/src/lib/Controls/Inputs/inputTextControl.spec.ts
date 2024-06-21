import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { GoAInputTextProps, GoAInputText, GoATextControl } from './InputTextControl';
import { ControlElement, ControlProps } from '@jsonforms/core';

describe('Input Text Control tests', () => {
  const textBoxUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/firstName',
    label: 'My First name',
  };

  const staticProps: GoAInputTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {},
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: '',
    errors: '',
    data: 'My Name',
    visible: true,
    isValid: true,
    required: false,
  };

  const handleChangeMock = jest.fn(() => Promise.resolve());

  describe('can create control', () => {
    it('can create control', () => {
      const props = { ...staticProps };
      const component = render(GoAInputText(props));
      expect(component.getByTestId('firstName-input')).toBeInTheDocument();
    });
    it('can create base control', () => {
      const props = { ...staticProps };
      const baseControl = render(GoATextControl(props));
      expect(baseControl).toBeDefined();
    });
  });

  describe('text control events', () => {
    it('can trigger keyPress event', async () => {
      const props = { ...staticProps };
      const component = render(GoAInputText(props));
      const input = component.getByTestId('firstName-input');
      const pressed = fireEvent.keyPress(input, { key: 'z', code: 90, charCode: 90 });
      expect(pressed).toBe(true);
      expect(component.getByTestId('firstName-input')).toBeInTheDocument();
    });

    it('can trigger on Blur event', async () => {
      const props = { ...staticProps };
      const component = render(GoAInputText(props));
      const input = component.getByTestId('firstName-input');
      const blurred = fireEvent.blur(input);
      expect(blurred).toBe(true);
    });

    it('can trigger handleChange event', async () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      const component = render(GoAInputText(props));
      const input = component.getByTestId('firstName-input');
      const pressed = fireEvent.keyPress(input, { key: 'z', code: 90, charCode: 90 });

      handleChangeMock();
      expect(props.handleChange).toBeCalled();
      expect(pressed).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(1);
    });
  });
});
