import { AssetType } from '../../../constants';
import type { File, RawFile } from '../../../../../shared/contracts/files';
interface Asset extends File {
    rawFile?: RawFile;
    type?: AssetType;
}
interface PendingAssetStepProps {
    addUploadedFiles?: (files: File[]) => void;
    folderId?: string | number | null;
    onClose: () => void;
    onEditAsset: (asset: File) => void;
    onRemoveAsset: (asset: File) => void;
    onAddAsset?: (asset: File) => void;
    assets: Asset[];
    onClickAddAsset: () => void;
    onCancelUpload: (rawFile: RawFile) => void;
    onUploadSucceed: (file: RawFile) => void;
    trackedLocation?: string;
    initialAssetsToAdd?: File[];
}
export declare const PendingAssetStep: ({ addUploadedFiles, folderId, onClose, onEditAsset, onRemoveAsset, assets, onClickAddAsset, onCancelUpload, onUploadSucceed, trackedLocation, }: PendingAssetStepProps) => import("react/jsx-runtime").JSX.Element;
export {};
