import { GroupBase } from 'react-select';
export type OptionSelectTree = {
    value: string | number | null;
    label?: string;
    children?: OptionSelectTree[];
};
export interface SelectTreeProps<Option = unknown, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>> {
    maxDisplayDepth?: number;
    defaultValue?: {
        value?: string | number | null;
    };
    options: OptionSelectTree[];
    onChange?: (value: Record<string, string | number>) => void;
    name?: string;
    menuPortalTarget?: HTMLElement | null;
    inputId?: string;
    error?: string;
    ariaErrorMessage?: string;
    isDisabled?: boolean;
    disabled?: boolean;
}
export declare const SelectTree: ({ options: defaultOptions, maxDisplayDepth, defaultValue, ...props }: SelectTreeProps) => import("react/jsx-runtime").JSX.Element;
