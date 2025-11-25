import type { File, RawFile } from '../../../../shared/contracts/files';
import type { AllowedFiles } from '../../utils';
type FileWithoutIdHash = Omit<File, 'id' | 'hash'>;
export interface Asset extends Omit<File, 'folder'> {
    isLocal?: boolean;
    rawFile?: RawFile;
    folder?: File['folder'] & {
        id: number;
    };
}
export interface UploadAssetDialogProps {
    addUploadedFiles?: (files: Asset[] | File[]) => void;
    folderId?: string | number | null;
    initialAssetsToAdd?: Asset[];
    onClose: () => void;
    open: boolean;
    trackedLocation?: string;
    validateAssetsTypes?: (assets: FileWithoutIdHash[] | Asset[], cb: (assets?: AllowedFiles[], error?: string) => void) => void;
}
export declare const UploadAssetDialog: ({ initialAssetsToAdd, folderId, onClose, addUploadedFiles, trackedLocation, open, validateAssetsTypes, }: UploadAssetDialogProps) => import("react/jsx-runtime").JSX.Element;
export {};
