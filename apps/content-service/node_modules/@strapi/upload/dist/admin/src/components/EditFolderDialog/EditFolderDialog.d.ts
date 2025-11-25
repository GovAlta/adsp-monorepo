import type { FolderDefinition } from '../../../../shared/contracts/folders';
export interface EditFolderDialogProps {
    parentFolderId?: string | number | null;
    location?: string;
    folder?: FolderDefinition;
    open?: boolean;
    onClose: (payload?: {
        created?: boolean | undefined;
    } | boolean) => void;
}
export declare const EditFolderContent: ({ onClose, folder, location, parentFolderId, }: EditFolderDialogProps) => import("react/jsx-runtime").JSX.Element;
export declare const EditFolderDialog: ({ open, onClose, ...restProps }: EditFolderDialogProps) => import("react/jsx-runtime").JSX.Element;
