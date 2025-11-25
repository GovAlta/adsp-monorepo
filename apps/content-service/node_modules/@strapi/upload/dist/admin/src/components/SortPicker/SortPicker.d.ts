import type { Query } from '../../../../shared/contracts/files';
interface SortPickerProps {
    onChangeSort: (value: Query['sort'] | string) => void;
    value?: string;
}
export declare const SortPicker: ({ onChangeSort, value }: SortPickerProps) => import("react/jsx-runtime").JSX.Element;
export {};
