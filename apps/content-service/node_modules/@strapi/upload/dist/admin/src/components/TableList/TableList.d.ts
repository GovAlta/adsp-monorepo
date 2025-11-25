import type { File } from '../../../../shared/contracts/files';
import type { Folder } from '../../../../shared/contracts/folders';
import type { AllowedTypes } from '../AssetCard/AssetCard';
export interface FileRow extends File {
    folderURL?: string;
    isSelectable?: boolean;
    type?: string;
}
export interface FolderRow extends Folder {
    folderURL?: string;
    isSelectable?: boolean;
    type?: string;
}
export interface TableListProps {
    isFolderSelectionAllowed?: boolean;
    allowedTypes?: AllowedTypes[];
    assetCount?: number;
    folderCount?: number;
    indeterminate?: boolean;
    onChangeSort?: ((sortQuery: string) => void) | null;
    onChangeFolder?: ((folderId: number, folderPath?: string) => void) | null;
    onEditAsset?: ((asset: FileRow) => void) | null;
    onEditFolder?: ((folder: FolderRow) => void) | null;
    onSelectAll: (checked: boolean | string, rows?: FolderRow[] | FileRow[]) => void;
    onSelectOne: (element: FileRow | FolderRow) => void;
    rows?: FileRow[] | FolderRow[];
    selected?: FileRow[] | FolderRow[];
    shouldDisableBulkSelect?: boolean;
    sortQuery?: string;
}
export declare const TableList: ({ assetCount, folderCount, indeterminate, onChangeSort, onChangeFolder, onEditAsset, onEditFolder, onSelectAll, onSelectOne, rows, selected, shouldDisableBulkSelect, sortQuery, }: TableListProps) => import("react/jsx-runtime").JSX.Element;
