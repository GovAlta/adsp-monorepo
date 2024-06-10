import { ControlProps } from '@jsonforms/core';
import { EventBlurControlProps, EventChangeControlProps, EventKeyPressControlProps } from '../Controls/Inputs/type';
import { isValidDate } from './stringUtils';
import { standardizeDate } from './dateUtils';

/**
 * Checks input controls data value to determine is required and has any data.
 * @param props - The JsonForm control props
 * @returns true if there is no data and is a required field
 */
export const isRequiredAndHasNoData = (props: ControlProps) => {
  const { data, required } = props;
  return required && (data === undefined || data.length === 0);
};

/**
 * Checks the key press value to determine if the key press is a 'Shift' or 'Tab'.
 * @param key - The key press value
 * @returns true if the key pressed is not a shift or tab key being pressed, otherwise false
 */
export const isNotKeyPressTabOrShift = (key: string) => {
  return !(key === 'Tab' || key === 'Shift') && key !== undefined;
};

/**
 * Helper function to process onKeyPress events for text controls.
 * @param props - EventKeyPressControlProps
 */
export const onKeyPressForTextControl = (props: EventKeyPressControlProps) => {
  const { key, value, controlProps } = props;
  const { handleChange, path } = controlProps;

  if (isNotKeyPressTabOrShift(key)) {
    handleChange(path, value);
  }
};

/**
 * Helper functions to process onKeyPress events for Numeric controls.
 * @param props - EventKeyPressControlProps
 */
export const onKeyPressNumericControl = (props: EventKeyPressControlProps) => {
  const { value, key, controlProps } = props;
  const { handleChange, path } = controlProps;
  if (isNotKeyPressTabOrShift(key)) {
    let newValue: string | number = '';
    if (value !== '') {
      newValue = +value;
    }
    handleChange(path, newValue);
  }
};

/**
 * Helper function to process onKeyPress events for Time controls
 * @param props - EventKeyPressControlProps
 */
export const onKeyPressForTimeControl = (props: EventKeyPressControlProps) => {
  const { controlProps, key } = props;
  const { value } = props;
  const { handleChange, path } = controlProps;

  if (isNotKeyPressTabOrShift(key)) {
    handleChange(path, value);
  }
};

/**
 * Helper function to process onKeyPress events for Date/Date Time controls
 * @param props - EventKeyPressControlProps
 */
export const onKeyPressForDateControl = (props: EventKeyPressControlProps) => {
  const { controlProps, key } = props;
  let { value } = props;
  const { handleChange, path } = controlProps;

  if (isNotKeyPressTabOrShift(key)) {
    value = standardizeDate(value) || '';
    handleChange(path, value);
  }
};

/**
 * Helper function to process onBlur events for text controls.
 * @param props - EventBlurControlProps
 */
export const onBlurForTextControl = (props: EventBlurControlProps) => {
  const { value, controlProps } = props;
  const { handleChange, path } = controlProps;
  if (isRequiredAndHasNoData(controlProps)) {
    handleChange(path, value);
  }
};

/**
 * Helper function to process onBlur events for Numeric controls.
 * @param props - EventBlurControlProps
 */
export const onBlurForNumericControl = (props: EventBlurControlProps) => {
  const { value, controlProps } = props;
  const { handleChange, path } = controlProps;

  if (isRequiredAndHasNoData(controlProps)) {
    let newValue: string | number = '';
    if (value !== '') {
      newValue = +value;
    }
    handleChange(path, newValue);
  }
};

/**
 * Helper function to process for onBlur event for Date/Date Time controls
 * @param props - EventBlurControlProps
 */
export const onBlurForDateControl = (props: EventBlurControlProps) => {
  const { controlProps } = props;
  let { value } = props;
  const { handleChange, path } = controlProps;

  if (isRequiredAndHasNoData(controlProps)) {
    value = standardizeDate(value) || '';
    handleChange(path, value);
  }
};

/**
 * Helper function to process for onBlur event for time controls
 * @param props - EventBlurControlProps
 */
export const onBlurForTimeControl = (props: EventBlurControlProps) => {
  const { controlProps } = props;
  const { value } = props;
  const { handleChange, path } = controlProps;

  if (isRequiredAndHasNoData(controlProps)) {
    handleChange(path, value);
  }
};

/**
 * Helper function to process onChange event for Date controls.
 * @param props - EventChangeControlProps
 */
export const onChangeForDateControl = (props: EventChangeControlProps) => {
  let { value } = props;
  const { controlProps } = props;
  const { handleChange, path, data } = controlProps;

  if (value && value !== null) {
    value = standardizeDate(value) || '';
    if (value !== data) {
      handleChange(path, value);
    }
  }
};

/**
 * Helper function to process onChange event for Date controls.
 * @param props - EventChangeControlProps
 */
export const onChangeForDateTimeControl = (props: EventChangeControlProps) => {
  let { value } = props;
  const { controlProps } = props;
  const { handleChange, path, data } = controlProps;

  if (value && value !== null) {
    value = isValidDate(value) ? new Date(value)?.toISOString() : '';
    if (data !== value) {
      handleChange(path, value);
    }
  }
};

/**
 * Helper function to process onChange event for Number/Integer controls.
 * @param props - EventChangeControlProps
 */
export const onChangeForNumericControl = (props: EventChangeControlProps) => {
  const { value } = props;
  const { controlProps } = props;
  const { handleChange, path, data } = controlProps;

  if (value && value !== null) {
    //Prevents handleChange from executing if the data has not changed
    //so the component will not re render.
    if (data !== +value) {
      let newValue: string | number = '';
      if (value !== '') {
        newValue = +value;
      }
      handleChange(path, newValue);
    }
  }
};

/**
 * Helper function to process onChange event for input enum checkboxes controls.
 * @param data
 * @param name
 * @param value
 * @returns {string[]}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onChangeForCheckboxData = (data: any, name: string, value: string) =>
  data ? (!value ? data?.filter((item: string | []) => item !== name) : [...data, name]) : [name];
