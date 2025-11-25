import type { IntlLabel } from '../../types';
interface Radio {
    title: IntlLabel;
    description: IntlLabel;
    value: any;
}
interface CustomRadioGroupProps {
    intlLabel: IntlLabel;
    name: string;
    onChange: (value: any) => void;
    radios?: Radio[];
    value?: string | boolean;
}
export declare const CustomRadioGroup: ({ intlLabel, name, onChange, radios, value, }: CustomRadioGroupProps) => import("react/jsx-runtime").JSX.Element;
export {};
