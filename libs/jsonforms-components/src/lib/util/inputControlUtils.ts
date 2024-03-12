import { ControlProps } from '@jsonforms/core';

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
