import { GoACallout } from '@abgov/react-components-new';
import React from 'react';

/**
 *  Used internally by registered Controls, the MessageControl
 *  is used to display an error message if a component cannot be rendered
 *  due to input errors - typically from options.componentProps.
 *
 *  NOTE: The component itself is not, and should not, be registered.
 *
 * @param message the message to be displayed
 *
 * @returns component for displaying the message in the correct style
 */

// TODO: Add styling
export const MessageControl = (message: string): JSX.Element => {
  return <GoACallout type="emergency">{message}</GoACallout>;
};
