import { ReactNode } from 'react';
import type { IntlLabel } from '../types';
interface TextareaEnumProps {
    description?: IntlLabel | null;
    disabled?: boolean;
    error?: string;
    intlLabel: IntlLabel;
    labelAction?: ReactNode;
    name: string;
    onChange: (value: {
        target: {
            name: string;
            value: string | string[];
        };
    }) => void;
    placeholder?: IntlLabel | null;
    value: string | string[] | undefined;
}
export declare const TextareaEnum: ({ description, disabled, error, intlLabel, labelAction, name, onChange, placeholder, value, }: TextareaEnumProps) => import("react/jsx-runtime").JSX.Element;
export {};
