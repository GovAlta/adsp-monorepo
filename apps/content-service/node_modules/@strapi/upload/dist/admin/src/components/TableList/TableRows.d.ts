import type { File } from '../../../../shared/contracts/files';
import type { Folder } from '../../../../shared/contracts/folders';
interface FileRow extends File {
    folderURL?: string;
    isSelectable?: boolean;
    type?: string;
}
interface FolderRow extends Folder {
    folderURL?: string;
    isSelectable?: boolean;
    type?: string;
}
export interface TableRowsProps {
    onChangeFolder?: ((folderId: number, folderPath?: string) => void) | null;
    onEditAsset: (asset: FileRow) => void;
    onEditFolder: (folder: FolderRow) => void;
    onSelectOne: (element: FileRow | FolderRow) => void;
    rows: FileRow[] | FolderRow[];
    selected: FileRow[] | FolderRow[];
}
export declare const TableRows: ({ onChangeFolder, onEditAsset, onEditFolder, onSelectOne, rows, selected, }: TableRowsProps) => import("react/jsx-runtime").JSX.Element;
export {};
