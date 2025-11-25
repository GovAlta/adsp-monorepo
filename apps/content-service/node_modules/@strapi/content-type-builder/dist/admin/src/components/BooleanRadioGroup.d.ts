import { IntlLabel } from '../types';
interface BooleanRadioGroupProps {
    intlLabel: IntlLabel;
    name: string;
    onChange: (value: any) => void;
}
export declare const BooleanRadioGroup: ({ onChange, name, intlLabel, ...rest }: BooleanRadioGroupProps) => import("react/jsx-runtime").JSX.Element;
export {};
