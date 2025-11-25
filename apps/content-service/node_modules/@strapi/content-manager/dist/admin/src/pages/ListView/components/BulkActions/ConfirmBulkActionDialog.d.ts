import * as React from 'react';
interface ConfirmBulkActionDialogProps {
    endAction: React.ReactNode;
    onToggleDialog: () => void;
    isOpen?: boolean;
    dialogBody: React.ReactNode;
}
declare const ConfirmBulkActionDialog: ({ onToggleDialog, isOpen, dialogBody, endAction, }: ConfirmBulkActionDialogProps) => import("react/jsx-runtime").JSX.Element;
interface ConfirmDialogPublishAllProps extends Pick<ConfirmBulkActionDialogProps, 'isOpen' | 'onToggleDialog'> {
    isConfirmButtonLoading?: boolean;
    onConfirm: () => void;
}
declare const ConfirmDialogPublishAll: ({ isOpen, onToggleDialog, isConfirmButtonLoading, onConfirm, }: ConfirmDialogPublishAllProps) => import("react/jsx-runtime").JSX.Element | null;
export { ConfirmDialogPublishAll, ConfirmBulkActionDialog };
export type { ConfirmDialogPublishAllProps, ConfirmBulkActionDialogProps };
