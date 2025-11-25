import type { IntlLabel } from '../../types';
export interface IconPickerProps {
    intlLabel: IntlLabel;
    name: string;
    onChange: (value: {
        target: {
            name: string;
            value: string;
        };
    }) => void;
    value?: string;
}
export declare const IconPicker: ({ intlLabel, name, onChange, value }: IconPickerProps) => import("react/jsx-runtime").JSX.Element;
