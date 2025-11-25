/**
 *
 * DraftAndPublishToggle
 *
 */
import type { IntlLabel } from '../types';
interface Description {
    id: string;
    defaultMessage: string;
    values?: Record<string, any>;
}
interface DraftAndPublishToggleProps {
    description?: Description;
    disabled?: boolean;
    intlLabel: IntlLabel;
    isCreating: boolean;
    name: string;
    onChange: (value: {
        target: {
            name: string;
            value: boolean;
        };
    }) => void;
    value?: boolean;
}
export declare const DraftAndPublishToggle: ({ description, disabled, intlLabel, isCreating, name, onChange, value, }: DraftAndPublishToggleProps) => import("react/jsx-runtime").JSX.Element;
export {};
