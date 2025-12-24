import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { GoabInputMultiLineTextProps, MultiLineText } from './InputMultiLineTextControl';
import { ControlElement, ControlProps } from '@jsonforms/core';

describe('Input Text Control tests', () => {
  const textBoxUiSchema: ControlElement = {
    type: 'Control',
    scope: '#/properties/firstName',
    label: 'My First name',
    options: {
      componentProps: {
        autoCapitalize: false,
      },
    },
  };

  const staticProps: GoabInputMultiLineTextProps & ControlProps = {
    uischema: textBoxUiSchema,
    schema: {},
    rootSchema: {},
    handleChange: (path, value) => {},
    enabled: true,
    label: 'First Name',
    id: 'firstName',
    config: {},
    path: 'test',
    errors: '',
    data: 'testValue',
    visible: true,
    isValid: true,
    required: false,
    isVisited: false,
    setIsVisited: () => {},
  };

  const handleChangeMock = jest.fn(() => Promise.resolve());

  describe('can create control for InputMultiLineTextControl', () => {
    it('can create control', () => {
      const props = { ...staticProps };
      const { baseElement } = render(<MultiLineText {...props} />);
      const input = baseElement.querySelector("goa-textarea[testId='firstName-input']");
      expect(input).toBeInTheDocument();
    });

    it('can create control InputMultiLineTextControl with errors', () => {
      const props = { ...staticProps, isVisited: true, errors: 'this is a error' };
      const { baseElement } = render(<MultiLineText {...props} />);
      const input = baseElement.querySelector("goa-textarea[testId='firstName-input']");
      expect(input.getAttribute('error')).toBe('true');
    });

    it('can create control with label as name', () => {
      const props = { ...staticProps, id: '', label: '', path: 'mytestInput' };
      const { baseElement } = render(<MultiLineText {...props} />);
      const input = baseElement.querySelector("goa-textarea[testId='-input']");
      expect(input.getAttribute('name')).toBe('mytestInput-text-area');
    });

    it('can create base control for InputMultiLineTextControl', () => {
      const props = { ...staticProps };
      const baseControl = render(<MultiLineText {...props} />);
      expect(baseControl).toBeDefined();
    });
  });

  describe('InputMultiLineTextControl control change events', () => {
    it('can trigger handleChange event', async () => {
      const { baseElement } = render(<MultiLineText {...staticProps} />);
      const input = baseElement.querySelector("goa-textarea[testId='firstName-input']");

      fireEvent(input, new CustomEvent('_change', { detail: { name: 'test', value: 'testValue' } }));
      expect(input.getAttribute('value')).toBe('testValue');
    });
    it('can trigger handleChange change events autoCapitalize', async () => {
      const textBoxUiSchema: ControlElement = {
        type: 'Control',
        scope: '#/properties/firstName',
        label: 'My First name',
        options: {
          componentProps: {
            autoCapitalize: true,
          },
        },
      };
      const props = { ...staticProps, uischema: textBoxUiSchema };
      const { baseElement } = render(<MultiLineText {...props} />);
      const input = baseElement.querySelector("goa-textarea[testId='firstName-input']");

      fireEvent(input, new CustomEvent('_change', { detail: { name: 'test', value: 'testValue' } }));
      expect(input.getAttribute('value')).toBe('testValue');
    });

    it('can trigger handleChange keyPress events autoCapitalize with empty text', async () => {
      const textBoxUiSchema: ControlElement = {
        type: 'Control',
        scope: '#/properties/firstName',
        label: 'My First name',
        options: {
          componentProps: {
            autoCapitalize: true,
          },
        },
      };
      const props = { ...staticProps, uischema: textBoxUiSchema, data: '' };
      const { baseElement } = render(<MultiLineText {...props} />);
      const input = baseElement.querySelector("goa-textarea[testId='firstName-input']");

      fireEvent(input, new CustomEvent('_keyPress', { detail: { name: 'test', value: '' } }));
      expect(input.getAttribute('value')).toBe('');
    });

    it('can trigger handleChange keyPress events not autoCapitalize with empty text', async () => {
      const props = { ...staticProps, data: 'test', required: true };
      const { baseElement } = render(<MultiLineText {...props} />);
      const input = baseElement.querySelector("goa-textarea[testId='firstName-input']");

      fireEvent(input, new CustomEvent('_keyPress', { detail: { name: 'test', value: 'test' } }));
      expect(input.getAttribute('value')).toBe('test');
    });
  });
});
