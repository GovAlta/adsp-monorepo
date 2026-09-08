import { ControlProps } from '@jsonforms/core';

export interface WithInputProps {
  label?: string;
  isVisited?: boolean;
  setIsVisited?: () => void;
}

/**
 * UI schema options recognized by the text input control.
 */
export interface InputControlOptions {
  /**
   * Mask template applied to the value on blur, e.g. "(###) ###-####".
   * '#' consumes one input character; every other character is inserted as a literal.
   * Formatting only; validation is still driven by the JSON schema `pattern`.
   */
  formatPattern?: string;
}

/**
 * Base event control props to handle event controls
 */
export interface EventControlProps {
  controlProps: ControlProps;
}

/**
 * Change event props to handle on change event controls
 */
export interface EventChangeControlProps extends EventControlProps {
  name: string;
  value: string | Date;
}

/**
 * KeyPress event props to handle event controls
 */
export interface EventKeyPressControlProps extends EventControlProps {
  name: string;
  value: string | Date;
  key: string;
}

/**
 * Blur event props to handle event controls
 */
export interface EventBlurControlProps extends EventControlProps {
  name: string;
  value: string | Date;
}
