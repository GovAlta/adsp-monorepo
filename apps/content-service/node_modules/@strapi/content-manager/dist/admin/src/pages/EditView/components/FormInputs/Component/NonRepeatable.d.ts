import type { ComponentInputProps } from './Input';
type NonRepeatableComponentProps = Omit<ComponentInputProps, 'required' | 'label'>;
declare const NonRepeatableComponent: ({ attribute, name, children, layout, }: NonRepeatableComponentProps) => import("react/jsx-runtime").JSX.Element;
export { NonRepeatableComponent };
export type { NonRepeatableComponentProps };
