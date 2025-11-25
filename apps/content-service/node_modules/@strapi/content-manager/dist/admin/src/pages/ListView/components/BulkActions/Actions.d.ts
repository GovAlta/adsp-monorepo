import * as React from 'react';
import { ButtonProps } from '@strapi/design-system';
import { DialogOptions, ModalOptions, NotificationOptions } from '../../../EditView/components/DocumentActions';
import type { BulkActionComponent } from '../../../../content-manager';
interface BulkActionDescription {
    dialog?: DialogOptions | NotificationOptions | ModalOptions;
    disabled?: boolean;
    icon?: React.ReactNode;
    label: string;
    onClick?: (event: React.SyntheticEvent) => void;
    /**
     * @default 'default'
     */
    type?: 'icon' | 'default';
    /**
     * @default 'secondary'
     */
    variant?: ButtonProps['variant'];
}
declare const BulkActionsRenderer: () => import("react/jsx-runtime").JSX.Element;
declare const Emphasis: (chunks: React.ReactNode) => import("react/jsx-runtime").JSX.Element;
declare const DEFAULT_BULK_ACTIONS: BulkActionComponent[];
export { DEFAULT_BULK_ACTIONS, BulkActionsRenderer, Emphasis };
export type { BulkActionDescription };
