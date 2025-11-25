import { IntlLabel } from '../types';
interface Metadata {
    intlLabel: IntlLabel;
    disabled?: boolean;
    hidden?: boolean;
}
interface Option {
    metadatas: Metadata;
    key: string | number;
    value: string | number;
}
interface BooleanDefaultValueSelectProps {
    intlLabel: IntlLabel;
    name: string;
    onChange: (value: any) => void;
    options: Option[];
    value?: any;
}
export declare const BooleanDefaultValueSelect: ({ intlLabel, name, options, onChange, value, }: BooleanDefaultValueSelectProps) => import("react/jsx-runtime").JSX.Element;
export {};
