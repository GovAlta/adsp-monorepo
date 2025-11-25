import type { ComponentInputProps } from './Input';
type RepeatableComponentProps = Omit<ComponentInputProps, 'required' | 'label'>;
declare const RepeatableComponent: ({ attribute, disabled, name, mainField, children, layout, }: RepeatableComponentProps) => import("react/jsx-runtime").JSX.Element;
export { RepeatableComponent };
export type { RepeatableComponentProps };
