import { TextInputProps } from '@strapi/design-system';
import { MessageDescriptor } from 'react-intl';
interface TokenNameProps extends Pick<TextInputProps, 'onChange' | 'value'> {
    error?: string | MessageDescriptor;
    canEditInputs: boolean;
}
export declare const TokenName: ({ error, value, onChange, canEditInputs }: TokenNameProps) => import("react/jsx-runtime").JSX.Element;
export {};
