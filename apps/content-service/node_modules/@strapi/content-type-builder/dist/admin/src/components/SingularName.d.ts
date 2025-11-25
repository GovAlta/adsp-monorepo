import type { IntlLabel } from '../types';
interface SingularNameProps {
    description?: IntlLabel | null;
    error?: string | null;
    intlLabel: IntlLabel;
    modifiedData: Record<string, any>;
    name: string;
    onChange: (value: {
        target: {
            name: string;
            value: string;
        };
    }) => void;
    value?: string | null;
}
export declare const SingularName: ({ description, error, intlLabel, modifiedData, name, onChange, value, }: SingularNameProps) => import("react/jsx-runtime").JSX.Element;
export {};
