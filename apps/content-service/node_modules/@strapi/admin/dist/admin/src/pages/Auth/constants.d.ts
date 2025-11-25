import type { ComponentType } from 'react';
import { RegisterProps } from './components/Register';
export type AuthType = 'login' | 'register' | 'register-admin' | 'forgot-password' | 'reset-password' | 'forgot-password-success' | 'oops' | 'providers';
export type FormDictionary = Record<AuthType, ComponentType | ComponentType<RegisterProps>>;
export declare const FORMS: {
    'forgot-password': () => import("react/jsx-runtime").JSX.Element;
    'forgot-password-success': () => import("react/jsx-runtime").JSX.Element;
    login: () => null;
    oops: () => import("react/jsx-runtime").JSX.Element;
    register: ({ hasAdmin }: RegisterProps) => import("react/jsx-runtime").JSX.Element;
    'register-admin': ({ hasAdmin }: RegisterProps) => import("react/jsx-runtime").JSX.Element;
    'reset-password': () => import("react/jsx-runtime").JSX.Element;
    providers: () => null;
};
