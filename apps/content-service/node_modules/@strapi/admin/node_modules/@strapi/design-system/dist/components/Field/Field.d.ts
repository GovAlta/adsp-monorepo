import * as React from 'react';
import { FlexProps } from '../../primitives/Flex';
import { TypographyProps } from '../../primitives/Typography';
interface FieldContextValue {
    /**
     * @default false
     */
    error?: string | boolean;
    /**
     * @default null
     */
    hint?: React.ReactNode;
    id?: string;
    labelNode?: HTMLLabelElement;
    name?: string;
    /**
     * @default false
     */
    required?: boolean;
    setLabelNode?: (node: HTMLLabelElement) => void;
}
declare const useField: (consumerName: string) => FieldContextValue;
interface RootProps extends FlexProps, Omit<Partial<FieldContextValue>, 'labelNode' | 'setLabelNode'> {
    children: React.ReactNode;
}
declare const Root: React.ForwardRefExoticComponent<Omit<RootProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
interface LabelProps extends Omit<TypographyProps<'label'>, 'tag' | 'htmlFor'> {
    action?: React.ReactNode;
}
declare const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    disabled?: boolean;
    endAction?: React.ReactNode;
    /**
     * If you're not using this in the FieldProvider
     * you can provide the error state manually
     */
    hasError?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    /**
     * @default "M"
     */
    size?: 'S' | 'M';
    startAction?: React.ReactNode;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
declare const Hint: () => import("react/jsx-runtime").JSX.Element | null;
declare const Error: () => import("react/jsx-runtime").JSX.Element | null;
interface ActionProps extends Omit<FlexProps<'button'>, 'tag' | 'type'> {
    label: string;
    children: React.ReactNode;
}
declare const Action: React.ForwardRefExoticComponent<Omit<ActionProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
type Props = RootProps;
export { Root, Label, Input, Hint, Error, Action, useField };
export type { Props, LabelProps, InputProps, ActionProps };
//# sourceMappingURL=Field.d.ts.map