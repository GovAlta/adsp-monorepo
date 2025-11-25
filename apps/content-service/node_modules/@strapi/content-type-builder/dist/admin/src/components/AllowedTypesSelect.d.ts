import { IntlLabel } from '../types';
interface AllowedTypesSelectProps {
    intlLabel: IntlLabel;
    name: string;
    onChange: (value: any) => void;
    value?: any;
}
export declare const AllowedTypesSelect: ({ intlLabel, name, onChange, value, }: AllowedTypesSelectProps) => import("react/jsx-runtime").JSX.Element;
export {};
