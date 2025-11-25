import { MessageDescriptor } from 'react-intl';
import type { Data } from '@strapi/types';
interface Token {
    id: Data.ID;
    name: string;
}
interface FormHeadProps<TToken extends Token | null> {
    title: MessageDescriptor;
    token: TToken;
    canEditInputs: boolean;
    canRegenerate: boolean;
    canShowToken?: boolean;
    setToken: (token: TToken) => void;
    toggleToken?: () => void;
    showToken?: boolean;
    isSubmitting: boolean;
    regenerateUrl: string;
}
export declare const FormHead: <TToken extends Token | null>({ title, token, setToken, toggleToken, showToken, canShowToken, canEditInputs, canRegenerate, isSubmitting, regenerateUrl, }: FormHeadProps<TToken>) => import("react/jsx-runtime").JSX.Element;
export {};
