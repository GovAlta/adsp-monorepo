import { ControlProps } from '@jsonforms/core';

export interface WithInputProps {
  label?: string;
  isVisited?: boolean;
  setIsVisited?: () => void;
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
