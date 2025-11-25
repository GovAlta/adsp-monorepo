import type { Folder } from '../../../../../shared/contracts/folders';
import type { CrumbDefinition } from '../../../components/Breadcrumbs/Breadcrumbs';
interface HeaderProps {
    breadcrumbs?: Array<CrumbDefinition> | null;
    canCreate: boolean;
    folder?: Folder | null;
    onToggleEditFolderDialog: ({ created }?: {
        created?: boolean;
    }) => void;
    onToggleUploadAssetDialog: () => void;
}
export declare const Header: ({ breadcrumbs, canCreate, folder, onToggleEditFolderDialog, onToggleUploadAssetDialog, }: HeaderProps) => import("react/jsx-runtime").JSX.Element;
export {};
