import { OptionProps as ReactSelectOptionProps } from 'react-select';
import type { Folder } from '../../../../shared/contracts/folders';
interface SelectProps {
    maxDisplayDepth: number;
    openValues: string[];
    onOptionToggle: (value: string) => void;
}
interface FolderWithDepth extends Folder {
    depth: number;
    value: string;
}
interface OptionProps extends ReactSelectOptionProps<FolderWithDepth, false> {
    selectProps: SelectProps & ReactSelectOptionProps<FolderWithDepth, false>['selectProps'];
}
export declare const Option: ({ children, data, selectProps, ...props }: OptionProps) => import("react/jsx-runtime").JSX.Element;
export {};
