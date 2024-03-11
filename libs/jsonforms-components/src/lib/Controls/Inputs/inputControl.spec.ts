import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GoADateInput, errMalformedDate } from './InputDateControl';
import { GoAInputDateProps } from './InputDateControl';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { isNotKeyPressTabOrShift, isRequiredAndHasNoData } from '../../util/inputControlUtils';

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
    it('isRequiredAndHasNoData has no data is truthy', () => {
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
        handleChange: (path, value) => {},
      };
      const isValid = isRequiredAndHasNoData(controlUtilsHasNoDataProps);
      expect(isValid).toBe(true);
    });

    it('isRequiredAndHasNoData has no data is falsy', () => {
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
        handleChange: (path, value) => {},
      };
      const isValid = isRequiredAndHasNoData(controlUtilsHasDataProps);

      expect(isValid).toBe(false);
    });

    it('isNotKeyPressTabOrShift is truthy', () => {
      expect(isNotKeyPressTabOrShift('Tab')).toBe(false);
      expect(isNotKeyPressTabOrShift('Shift')).toBe(false);
    });

    it('isNotKeyPressTabOrShift is falsy', () => {
      expect(isNotKeyPressTabOrShift('T')).toBe(true);
      expect(isNotKeyPressTabOrShift('!')).toBe(true);
    });
  });
});
