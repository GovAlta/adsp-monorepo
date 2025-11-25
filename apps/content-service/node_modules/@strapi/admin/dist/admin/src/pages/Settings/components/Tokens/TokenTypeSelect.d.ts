import { SingleSelectProps } from '@strapi/design-system';
import { MessageDescriptor } from 'react-intl';
interface TokenTypeSelectProps extends Pick<SingleSelectProps, 'onChange' | 'value'> {
    name?: string;
    options: Array<{
        label: MessageDescriptor;
        value: string;
    }>;
    error?: string | MessageDescriptor;
    canEditInputs: boolean;
    label: MessageDescriptor;
}
export declare const TokenTypeSelect: ({ name, error, value, onChange, canEditInputs, options, label, }: TokenTypeSelectProps) => import("react/jsx-runtime").JSX.Element;
export {};
