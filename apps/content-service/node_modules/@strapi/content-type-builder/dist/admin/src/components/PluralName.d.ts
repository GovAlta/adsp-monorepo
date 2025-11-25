import type { IntlLabel } from '../types';
interface Description {
    id: string;
    defaultMessage: string;
    values?: Record<string, any>;
}
interface PluralNameProps {
    description?: Description;
    error?: string;
    intlLabel: IntlLabel;
    modifiedData: Record<string, any>;
    name: string;
    onChange: (value: {
        target: {
            name: string;
            value: string;
        };
    }) => void;
    value?: string;
}
export declare const PluralName: ({ description, error, intlLabel, modifiedData, name, onChange, value, }: PluralNameProps) => import("react/jsx-runtime").JSX.Element;
export {};
