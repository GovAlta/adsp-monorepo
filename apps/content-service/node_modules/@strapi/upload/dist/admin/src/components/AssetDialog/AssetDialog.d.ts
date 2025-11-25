import type { File as Asset } from '../../../../shared/contracts/files';
import type { Folder } from '../../../../shared/contracts/folders';
import type { AllowedTypes } from '../AssetCard/AssetCard';
export interface FileRow extends Asset {
    folderURL?: string;
    isSelectable?: boolean;
    type?: string;
}
export interface FolderRow extends Folder {
    folderURL?: string;
    isSelectable?: boolean;
    type?: string;
}
interface AssetContentProps {
    allowedTypes?: AllowedTypes[];
    folderId?: number | null;
    onClose: () => void;
    onAddAsset: (arg?: {
        folderId: number | {
            id: number;
        } | null | undefined;
    }) => void;
    onAddFolder: ({ folderId }: {
        folderId: number | {
            id: number;
        } | null | undefined;
    }) => void;
    onChangeFolder: (folderId: number | null) => void;
    onValidate: (selectedAssets: Asset[]) => void;
    multiple?: boolean;
    trackedLocation?: string;
    initiallySelectedAssets?: Asset[];
}
export declare const AssetContent: ({ allowedTypes, folderId, onClose, onAddAsset, onAddFolder, onChangeFolder, onValidate, multiple, initiallySelectedAssets, trackedLocation, }: AssetContentProps) => import("react/jsx-runtime").JSX.Element;
interface AssetDialogProps extends AssetContentProps {
    open?: boolean;
}
export declare const AssetDialog: ({ open, onClose, ...restProps }: AssetDialogProps) => import("react/jsx-runtime").JSX.Element;
export {};
