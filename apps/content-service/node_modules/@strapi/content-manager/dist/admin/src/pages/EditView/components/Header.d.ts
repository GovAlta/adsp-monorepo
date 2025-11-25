import * as React from 'react';
import type { DocumentActionComponent } from '../../../content-manager';
interface HeaderProps {
    isCreating?: boolean;
    status?: 'draft' | 'published' | 'modified';
    title?: string;
}
declare const Header: ({ isCreating, status, title: documentTitle }: HeaderProps) => import("react/jsx-runtime").JSX.Element;
interface DialogOptions {
    type: 'dialog';
    title: string;
    content?: React.ReactNode;
    footer?: React.ReactNode;
}
interface HeaderActionDescription {
    disabled?: boolean;
    label: string;
    icon?: React.ReactNode;
    type?: 'icon' | 'default';
    onClick?: (event: React.SyntheticEvent) => Promise<boolean | void> | boolean | void;
    dialog?: DialogOptions;
    options?: Array<{
        disabled?: boolean;
        label: string;
        startIcon?: React.ReactNode;
        textValue?: string;
        value: string;
    }>;
    onSelect?: (value: string) => void;
    value?: string;
    customizeContent?: (value: string) => React.ReactNode;
}
declare const DEFAULT_HEADER_ACTIONS: DocumentActionComponent[];
export { Header, DEFAULT_HEADER_ACTIONS };
export type { HeaderProps, HeaderActionDescription };
