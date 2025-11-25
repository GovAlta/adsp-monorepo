import { IntlLabel } from '../types';
interface CheckboxWithNumberFieldProps {
    error?: string;
    intlLabel: IntlLabel;
    modifiedData: Record<string, any>;
    name: string;
    onChange: (value: any) => void;
    value?: any;
}
export declare const CheckboxWithNumberField: ({ error, intlLabel, modifiedData, name, onChange, value, }: CheckboxWithNumberFieldProps) => import("react/jsx-runtime").JSX.Element;
export {};
