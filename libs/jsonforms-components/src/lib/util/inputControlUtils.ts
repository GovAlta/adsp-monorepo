import { ControlProps } from '@jsonforms/core';

/**
 *
 * @param props - The JsonForm control props
 * @returns true if there is no data and is a required field
 */
export const isRequiredAndHasNoData = (props: ControlProps) => {
  const { data, required } = props;
  return required && (data === undefined || data.length === 0);
};

/**
 *
 * @param key - The key press value
 * @returns true if the key pressed is not a shift or tab key being pressed, otherwise false
 */
export const isNotKeyPressTabOrShift = (key: string) => {
  return !(key === 'Tab' || key === 'Shift') && key !== undefined;
};
