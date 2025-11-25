import { TextareaProps } from '@strapi/design-system';
import { MessageDescriptor } from 'react-intl';
interface TokenDescriptionProps extends Pick<TextareaProps, 'onChange' | 'value'> {
    error?: string | MessageDescriptor;
    canEditInputs: boolean;
}
export declare const TokenDescription: ({ error, value, onChange, canEditInputs, }: TokenDescriptionProps) => import("react/jsx-runtime").JSX.Element;
export {};
