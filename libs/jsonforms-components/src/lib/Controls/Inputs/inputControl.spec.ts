import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoADateInput, errMalformedDate } from './InputDateControl';
import { GoAInputDateProps } from './InputDateControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import {
  isNotKeyPressTabOrShift,
  isRequiredAndHasNoData,
  onBlurForDateControl,
  onBlurForNumericControl,
  onBlurForTextControl,
  onBlurForTimeControl,
  onKeyPressForTimeControl,
  onKeyPressForDateControl,
  onKeyPressForTextControl,
  onKeyPressNumericControl,
  onChangeForDateControl,
  onChangeForDateTimeControl,
  onChangeForNumericControl,
} from '../../util/inputControlUtils';

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
  handleChange: () => {},
  enabled: true,
  label: 'Date control test',
  id: 'My ID',
  config: {},
  path: '',
  errors: '',
  data: theDate.theDate,
  visible: true,
  isValid: true,
};

describe('input control tests', () => {
  describe('input date control tests', () => {
    it('can render valid date', () => {
      const props = { ...staticProps, uischema: uiSchema('2023-02-01', '2025-02-01') };
      const component = render(GoADateInput(props));
      expect(component.getByTestId('My ID-input')).toBeInTheDocument();
    });

    it('can detect malformed max dates in schema', () => {
      const props = { ...staticProps, uischema: uiSchema('2023-02-01', '2025a/02-01') };
      const component = render(GoADateInput(props));
      expect(component.getByText(errMalformedDate(props.uischema.scope, 'Max'))).toBeInTheDocument();
    });

    it('can detect malformed min dates in schema', () => {
      const props = { ...staticProps, uischema: uiSchema('2023b/02-01', '2025-02-01') };
      const component = render(GoADateInput(props));
      expect(component.getByText(errMalformedDate(props.uischema.scope, 'Min'))).toBeInTheDocument();
    });

    it('will reformat non-standard min dates', () => {
      const props = { ...staticProps, uischema: uiSchema('2023/02-01', '2025-02-01') };
      const component = render(GoADateInput(props));
      expect(component.getByTestId('My ID-input')).toBeInTheDocument();
    });

    it('will reformat non-standard max', () => {
      const props = { ...staticProps, uischema: uiSchema('2023-02-01', '2025/02-01') };
      const component = render(GoADateInput(props));
      expect(component.getByTestId('My ID-input')).toBeInTheDocument();
    });
  });

  describe('test input control util functions', () => {
    it('isRequiredAndHasNoData has NO data and is required', () => {
      const controlUtilsHasNoDataProps: ControlProps = {
        required: true,
        data: undefined,
        enabled: true,
        label: 'Control input',
        schema: dateSchema,
        uischema: uiSchema('2023-02-01', '2025-02-01'),
        rootSchema: dateSchema,
        id: 'control id',
        config: {},
        path: '',
        errors: '',
        visible: true,
        handleChange: jest.fn(),
      };
      const isValid = isRequiredAndHasNoData(controlUtilsHasNoDataProps);
      expect(isValid).toBe(true);
    });

    it('isRequiredAndHasNoData has data and is required', () => {
      const controlUtilsHasDataProps: ControlProps = {
        required: true,
        data: 'abc',
        enabled: true,
        label: 'Control input',
        schema: dateSchema,
        uischema: uiSchema('2023-02-01', '2025-02-01'),
        rootSchema: dateSchema,
        id: 'control id',
        config: {},
        path: '',
        errors: '',
        visible: true,
        handleChange: jest.fn(),
      };
      const isValid = isRequiredAndHasNoData(controlUtilsHasDataProps);

      expect(isValid).toBe(false);
    });

    it('isNotKeyPressTabOrShift is not a Shift or Tab key', () => {
      expect(isNotKeyPressTabOrShift('T')).toBe(true);
      expect(isNotKeyPressTabOrShift('1')).toBe(true);
    });

    it('isNotKeyPressTabOrShift is a Shift or Tab key', () => {
      expect(isNotKeyPressTabOrShift('Tab')).toBe(false);
      expect(isNotKeyPressTabOrShift('Shift')).toBe(false);
    });
  });

  describe('Event Handlers for input control tests ', () => {
    const handleChangeMock = jest.fn(() => Promise.resolve());
    const regExNumbers = new RegExp('^\\d+$');
    const props: ControlProps = {
      data: '',
      required: true,
      errors: '',
      rootSchema: {},
      visible: true,
      enabled: true,
      id: 'testId',
      path: 'testPath',
      label: 'test',
      uischema: {
        type: 'Control',
        scope: '#/properties/firstName',
        label: 'My First name',
      },
      schema: {},
      handleChange: (path, value) => {},
    };

    beforeEach(() => {
      handleChangeMock.mockReset();
    });

    it('onKeyPressForTextControl data not capitalize', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onKeyPressForTextControl({
        name: 'test',
        value: 'value',
        key: ' z',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('onKeyPressForTextControl data capitalize', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onKeyPressForTextControl({
        name: 'test',
        value: 'VALUE',
        key: ' z',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('onKeyPressForDateControl is valid date', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onKeyPressForDateControl({
        name: 'dateOfEntry',
        value: '04/04/2024',
        key: '4',
        controlProps: newProps as ControlProps,
      });
      expect(handleChangeMock.mock.calls.length).toBe(1);
      expect(newProps.handleChange).toBeCalled();
    });

    it('onKeyPressDateControl doesnt triggered handleChange', () => {
      const newProps = { ...props };
      const eventProps = {
        name: 'dateOfEntry',
        value: '',
        key: 'Tab',
        controlProps: newProps as ControlProps,
      };
      onKeyPressForDateControl(eventProps);
      expect(eventProps.key).toBe('Tab');
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });

    it('onKeyPressNumericControl is valid data', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onKeyPressNumericControl({
        name: 'age',
        value: '18',
        key: '1',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('onKeyPressNumericControl doesnt trigger handleChange', () => {
      const newProps = { ...props };
      const eventProps = { name: 'age', value: '', key: 'Tab', controlProps: newProps as ControlProps };
      onKeyPressNumericControl(eventProps);
      expect(eventProps.key).toBe('Tab');
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });

    it('onKeyPressTimeControl is valid date', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onKeyPressForTimeControl({
        name: 'dateOfEntry',
        value: '01:01:00 AM',
        key: '0',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('onKeyPressTimeControl doesnt trigger handleChange', () => {
      const newProps = { ...props };
      const eventProps = {
        name: 'dateOfEntry',
        value: '',
        key: 'Tab',
        controlProps: newProps as ControlProps,
      };
      onKeyPressForTimeControl(eventProps);

      expect(eventProps.key).toBe('Tab');
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });

    it('onBlurForTextControl data not capitalize ', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onBlurForTextControl({
        name: 'test',
        value: 'value',
        controlProps: newProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });
    it('onBlurForTextControl data capitalize ', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onBlurForTextControl({
        name: 'test',
        value: 'VALUE',
        controlProps: newProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('onBlurForNumericControl is valid data', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      const eventProps = {
        name: 'age',
        value: '18',
        controlProps: newProps as ControlProps,
      };

      onBlurForNumericControl(eventProps);
      expect(eventProps.value).toMatch(regExNumbers);
      expect(newProps.handleChange).toBeCalled();
    });

    it('onBlurForNumericControl is invalid data', () => {
      const newProps = { ...props };

      const eventProps = {
        name: 'age',
        value: 'abc',
        controlProps: newProps as ControlProps,
      };

      onBlurForNumericControl(eventProps);
      expect(eventProps.value).not.toMatch(regExNumbers);
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });

    it('onBlurForDateControl is valid data', () => {
      const newProps = { ...props, handleChange: handleChangeMock };
      onBlurForDateControl({
        name: 'age',
        value: '04/04/2024',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('onBlurForDateControl is invalid data', () => {
      const newProps = { ...props };
      const eventProps = { name: 'age', value: '', controlProps: newProps as ControlProps };
      onBlurForDateControl(eventProps);

      expect(eventProps.value).toBe('');
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });

    it('onBlurTimeControl is valid data', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onBlurForTimeControl({
        name: 'dateOfEntry',
        value: '01:01:00 AM',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('onChangeForDateControl with data', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onChangeForDateControl({
        name: 'dateOfEntry',
        value: '04/04/2024',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('onChangeForDateTimeControl with data', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onChangeForDateTimeControl({
        name: 'dateOfEntry',
        value: '04/04/2024 01:01:00 AM',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('onChangeForNumericControl with data', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onChangeForNumericControl({
        name: 'age',
        value: '50',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });
    it('onChangeForDateTimeControl with invalid data', () => {
      const newProps = { ...props };

      const eventProps = {
        name: 'dateOfEntry',
        value: '',
        controlProps: newProps as ControlProps,
      };

      onChangeForDateTimeControl(eventProps);
      expect(eventProps.value).toBe('');
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });

    it('onChangeForNumericControl with invalid data', () => {
      const newProps = { ...props };

      const eventProps = {
        name: 'age',
        value: 'ab',
        controlProps: newProps as ControlProps,
      };
      onChangeForNumericControl(eventProps);
      expect(eventProps.value).not.toMatch(regExNumbers);
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });
  });
});
