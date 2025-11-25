import type { File as FileDefinition, RawFile } from '../../../../shared/contracts/files';
export interface Asset extends Omit<FileDefinition, 'folder'> {
    isLocal?: boolean;
    rawFile?: RawFile;
    folder?: FileDefinition['folder'] & {
        id: number;
    };
}
interface EditAssetContentProps {
    asset?: Asset;
    canUpdate?: boolean;
    canCopyLink?: boolean;
    canDownload?: boolean;
    trackedLocation?: string;
    onClose: (arg?: Asset | null | boolean) => void;
    omitFields?: ('caption' | 'alternativeText')[];
    omitActions?: 'replace'[];
}
export declare const EditAssetContent: ({ onClose, asset, canUpdate, canCopyLink, canDownload, trackedLocation, omitFields, omitActions, }: EditAssetContentProps) => import("react/jsx-runtime").JSX.Element;
interface EditAssetDialogProps {
    asset: Asset;
    canUpdate?: boolean;
    canCopyLink?: boolean;
    canDownload?: boolean;
    trackedLocation?: string;
    open: boolean;
    onClose: (arg?: Asset | null | boolean) => void;
}
export declare const EditAssetDialog: ({ open, onClose, canUpdate, canCopyLink, canDownload, ...restProps }: EditAssetDialogProps) => import("react/jsx-runtime").JSX.Element;
export {};
