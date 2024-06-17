import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { GoAInputMultiLineTextProps, MultiLineText, MultiLineTextControlInput } from './InputMultiLineTextControl';
import { ControlElement, ControlProps } from '@jsonforms/core';

describe('Input Text Control tests', () => {
  const textBoxUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/firstName',
    label: 'My First name',
  };

  const staticProps: GoAInputMultiLineTextProps & ControlProps = {
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

  describe('can create control for InputMultiLineTextControl', () => {
    it('can create control', () => {
      const props = { ...staticProps };
      const component = render(MultiLineText(props));
      expect(component.getByTestId('firstName-input')).toBeInTheDocument();
    });

    it('can create control in review mode', () => {
      const props = { ...staticProps };
      const component = render(
        MultiLineText({ ...props, uischema: { ...props.uischema, options: { isStepperReview: true } } })
      );
      expect(component.getByTestId('input-multi-line-text-control-review')).toBeInTheDocument();
    });

    it('can create base control for InputMultiLineTextControl', () => {
      const props = { ...staticProps };
      const baseControl = render(MultiLineTextControlInput(props));
      expect(baseControl).toBeDefined();
    });
  });

  describe('InputMultiLineTextControl control events', () => {
    it('can trigger handleChange event', async () => {
      const props = { ...staticProps, handleChange: handleChangeMock };
      const component = render(MultiLineText(props));
      const input = component.getByTestId('firstName-input');
      const pressed = fireEvent.keyPress(input, { key: 'z', code: 90, charCode: 90 });

      handleChangeMock();
      expect(props.handleChange).toBeCalled();
      expect(pressed).toBe(true);
      expect(handleChangeMock.mock.calls.length).toBe(1);
    });
  });
});
