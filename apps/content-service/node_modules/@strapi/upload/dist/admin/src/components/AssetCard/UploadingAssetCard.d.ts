import { AssetType } from '../../constants';
import type { RawFile, File } from '../../../../shared/contracts/files';
interface UploadingAssetCardProps {
    onCancel: (rawFile: RawFile) => void;
    onStatusChange: (status: string) => void;
    addUploadedFiles: (files: File[]) => void;
    folderId?: string | number | null;
    asset: Asset;
    id?: string;
    size?: 'S' | 'M';
}
interface Asset extends File {
    rawFile?: RawFile;
    type?: AssetType;
}
export declare const UploadingAssetCard: ({ asset, onCancel, onStatusChange, addUploadedFiles, folderId, }: UploadingAssetCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
