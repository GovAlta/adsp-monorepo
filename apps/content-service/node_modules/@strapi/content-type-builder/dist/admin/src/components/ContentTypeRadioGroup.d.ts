import type { IntlLabel } from '../types';
interface Radio {
    title: IntlLabel;
    description: IntlLabel;
    value: any;
}
interface ContentTypeRadioGroupProps {
    intlLabel: IntlLabel;
    name: string;
    onChange: (value: any) => void;
    radios?: Radio[];
    value?: string | boolean;
}
export declare const ContentTypeRadioGroup: ({ onChange, ...rest }: ContentTypeRadioGroupProps) => import("react/jsx-runtime").JSX.Element;
export {};
