import type { File as FileDefinition, RawFile } from '../../../../../shared/contracts/files';
interface Asset extends Omit<FileDefinition, 'folder'> {
    isLocal?: boolean;
    rawFile?: RawFile;
    folder?: FileDefinition['folder'] & {
        id: number;
    };
}
interface PreviewBoxProps {
    asset: Asset;
    canUpdate: boolean;
    canCopyLink: boolean;
    canDownload: boolean;
    replacementFile?: File;
    onDelete: (asset?: Asset | null) => void;
    onCropFinish: () => void;
    onCropStart: () => void;
    onCropCancel: () => void;
    trackedLocation?: string;
}
export declare const PreviewBox: ({ asset, canUpdate, canCopyLink, canDownload, onDelete, onCropFinish, onCropStart, onCropCancel, replacementFile, trackedLocation, }: PreviewBoxProps) => import("react/jsx-runtime").JSX.Element;
export {};
