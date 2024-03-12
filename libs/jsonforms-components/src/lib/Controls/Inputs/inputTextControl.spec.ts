import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoAInputTextProps, GoAInputText } from './InputTextControl';
import { ControlElement } from '@jsonforms/core';
import exp from 'constants';

describe('Input Text Control tests', () => {
  const textBoxUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/firstName',
    label: 'My First name',
  };

  const staticProps: GoAInputTextProps = {
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
  };

  const handleChangeMock = jest.fn(() => Promise.resolve());

  describe('can create control', () => {
    it('can create control', () => {
      const props = { ...staticProps };
      const component = render(GoAInputText(props));
      expect(component.getByTestId('firstName-input')).toBeInTheDocument();
    });
  });

  describe('text control events', () => {
    it('can trigger keyPress event', async () => {
      const props = { ...staticProps };
      const component = render(GoAInputText(props));

      const input = component.getByTestId('firstName-input');
      const pressed = fireEvent.keyPress(input, { key: 'z', code: 90, charCode: 90 });

      expect(pressed).toBe(true);
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
      handleChangeMock();

      const input = component.getByTestId('firstName-input');
      const pressed = fireEvent.keyPress(input, { key: 'z', code: 90, charCode: 90 });

      expect(props.handleChange).toBeCalled();
      expect(pressed).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(1);
    });
  });
});
