import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoADateInput, errMalformedDate } from './InputDateControl';
import { GoAInputDateProps } from './InputDateControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { JsonFormsContext } from '@jsonforms/react';

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
  onChangeForInputControl,
} from '../../util/inputControlUtils';

const theDate = {
  theDate: '',
};

const mockContextValue = {
  errors: [],
  data: {},
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
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-date-picker[testId='My ID-input']");
      expect(input).toBeInTheDocument();
    });

    it('will reformat non-standard min dates', () => {
      const props = { ...staticProps, uischema: uiSchema('2023/02-01', '2025-02-01') };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-date-picker[testId='My ID-input']");
      expect(input).toBeInTheDocument();
    });

    it('will reformat non-standard max', () => {
      const props = { ...staticProps, uischema: uiSchema('2023-02-01', '2025/02-01') };
      const { baseElement } = render(
        <JsonFormsContext.Provider value={mockContextValue}>
          <GoADateInput {...props} />
        </JsonFormsContext.Provider>
      );
      const input = baseElement.querySelector("goa-date-picker[testId='My ID-input']");
      expect(input).toBeInTheDocument();
    });
  });

  describe('test input control util functions', () => {
    it('can check if there is NO data and is required', () => {
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

    it('can check if there is data and is required', () => {
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

    it('can check if key pressed is not a Shift or Tab key', () => {
      expect(isNotKeyPressTabOrShift('T')).toBe(true);
      expect(isNotKeyPressTabOrShift('1')).toBe(true);
    });

    it('can check if key pressed is a Shift or Tab key', () => {
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

    it('can handle key pressed data is NOT capitalize', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onKeyPressForTextControl({
        name: 'test',
        value: 'value',
        key: ' z',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can change data when input have change event', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onChangeForInputControl({
        name: 'test',
        value: 'value',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle key pressed data is capitalize for text control', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onKeyPressForTextControl({
        name: 'test',
        value: 'VALUE',
        key: ' z',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle key pressed is a valid date for date control', () => {
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

    it('can handle Tab key pressed doesnt triggered handleChange for date control', () => {
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

    it('can handle key pressed is valid data for numeric control', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onKeyPressNumericControl({
        name: 'age',
        value: '18',
        key: '1',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle key pressed doesnt trigger handleChange for numeric control', () => {
      const newProps = { ...props };
      const eventProps = { name: 'age', value: '', key: 'Tab', controlProps: newProps as ControlProps };
      onKeyPressNumericControl(eventProps);
      expect(eventProps.key).toBe('Tab');
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });

    it('can handle key pressed is valid date for date control', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onKeyPressForTimeControl({
        name: 'dateOfEntry',
        value: '01:01:00 AM',
        key: '0',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle key pressed doesnt trigger handleChange for time control', () => {
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

    it('can handle on blur data does NOT capitalize for text control', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onBlurForTextControl({
        name: 'test',
        value: 'value',
        controlProps: newProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle on blur data is capitalize for text control ', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onBlurForTextControl({
        name: 'test',
        value: 'VALUE',
        controlProps: newProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle on blur is valid data for numeric control', () => {
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

    it('can handle on blur is invalid data for numeric control', () => {
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

    it('can handle on blur is valid data for date control', () => {
      const newProps = { ...props, handleChange: handleChangeMock };
      onBlurForDateControl({
        name: 'age',
        value: '04/04/2024',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle on blur is invalid data for date control', () => {
      const newProps = { ...props };
      const eventProps = { name: 'age', value: '', controlProps: newProps as ControlProps };
      onBlurForDateControl(eventProps);

      expect(eventProps.value).toBe('');
      expect(handleChangeMock.mock.calls.length).toBe(0);
    });

    it('can handle on blur is valid data for time control', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onBlurForTimeControl({
        name: 'dateOfEntry',
        value: '01:01:00 AM',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle on change with data for date control', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onChangeForDateControl({
        name: 'dateOfEntry',
        value: '04/04/2024',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle on change with data for date time control', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onChangeForDateTimeControl({
        name: 'dateOfEntry',
        value: '04/04/2024 01:01:00 AM',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle on change with data for numeric control', () => {
      const newProps = { ...props, handleChange: handleChangeMock };

      onChangeForNumericControl({
        name: 'age',
        value: '50',
        controlProps: newProps as ControlProps,
      });
      expect(newProps.handleChange).toBeCalled();
    });

    it('can handle on change with invalid data for date time control', () => {
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

    it('can handle on change with invalid data for numeric control', () => {
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
