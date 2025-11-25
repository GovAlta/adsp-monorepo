import * as React from 'react';
import { NotificationConfig } from '@strapi/admin/strapi-admin';
import { ButtonProps } from '@strapi/design-system';
import type { DocumentActionComponent } from '../../../content-manager';
type DocumentActionPosition = 'panel' | 'header' | 'table-row' | 'preview' | 'relation-modal';
interface DocumentActionDescription {
    label: string;
    onClick?: (event: React.SyntheticEvent) => Promise<boolean | void> | boolean | void;
    icon?: React.ReactNode;
    /**
     * @default false
     */
    disabled?: boolean;
    /**
     * @default 'panel'
     * @description Where the action should be rendered.
     */
    position?: DocumentActionPosition | DocumentActionPosition[];
    dialog?: DialogOptions | NotificationOptions | ModalOptions;
    /**
     * @default 'secondary'
     */
    variant?: ButtonProps['variant'];
    loading?: ButtonProps['loading'];
}
interface DialogOptions {
    type: 'dialog';
    title: string;
    content?: React.ReactNode;
    variant?: ButtonProps['variant'];
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
}
interface NotificationOptions {
    type: 'notification';
    title: string;
    link?: {
        label: string;
        url: string;
        target?: string;
    };
    content?: string;
    onClose?: () => void;
    status?: NotificationConfig['type'];
    timeout?: number;
}
interface ModalOptions {
    type: 'modal';
    title: string;
    content: React.ComponentType<{
        onClose: () => void;
    }> | React.ReactNode;
    footer?: React.ComponentType<{
        onClose: () => void;
    }> | React.ReactNode;
    onClose?: () => void;
}
interface Action extends DocumentActionDescription {
    id: string;
}
interface DocumentActionsProps {
    actions: Action[];
}
declare const DocumentActions: ({ actions }: DocumentActionsProps) => import("react/jsx-runtime").JSX.Element | null;
interface DocumentActionButtonProps extends Action {
}
declare const DocumentActionButton: (action: DocumentActionButtonProps) => import("react/jsx-runtime").JSX.Element;
interface DocumentActionsMenuProps {
    actions: Action[];
    children?: React.ReactNode;
    label?: string;
    variant?: 'ghost' | 'tertiary';
}
declare const DocumentActionsMenu: ({ actions, children, label, variant, }: DocumentActionsMenuProps) => import("react/jsx-runtime").JSX.Element;
declare const DEFAULT_ACTIONS: DocumentActionComponent[];
export { DocumentActions, DocumentActionsMenu, DocumentActionButton, DEFAULT_ACTIONS };
export type { DocumentActionDescription, DocumentActionPosition, DialogOptions, NotificationOptions, ModalOptions, };
