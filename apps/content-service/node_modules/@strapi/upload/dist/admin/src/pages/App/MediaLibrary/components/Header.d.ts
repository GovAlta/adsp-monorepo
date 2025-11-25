import type { Folder } from '../../../../../../shared/contracts/folders';
import type { CrumbDefinition } from '../../../../components/Breadcrumbs/Breadcrumbs';
interface FolderDefinition extends Omit<Folder, 'children' | 'files' | 'parent'> {
    children: {
        count: number;
    };
    files: {
        count: number;
    };
    parent?: FolderDefinition;
}
export interface HeaderProps {
    breadcrumbs?: Array<CrumbDefinition> | null;
    canCreate: boolean;
    folder?: FolderDefinition | null;
    onToggleEditFolderDialog: ({ created }?: {
        created?: boolean;
    }) => void;
    onToggleUploadAssetDialog: () => void;
}
export declare const Header: ({ breadcrumbs, canCreate, folder, onToggleEditFolderDialog, onToggleUploadAssetDialog, }: HeaderProps) => import("react/jsx-runtime").JSX.Element;
export {};
