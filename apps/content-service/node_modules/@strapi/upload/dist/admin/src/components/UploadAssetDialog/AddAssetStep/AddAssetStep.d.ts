import type { RawFile, File } from '../../../../../shared/contracts/files';
export interface FileWithRawFile extends Omit<File, 'id' | 'hash'> {
    id?: string;
    hash?: string;
    rawFile: RawFile;
}
interface AddAssetStepProps {
    onClose: () => void;
    onAddAsset: (assets: FileWithRawFile[]) => void;
    trackedLocation?: string;
}
export declare const AddAssetStep: ({ onClose, onAddAsset, trackedLocation }: AddAssetStepProps) => import("react/jsx-runtime").JSX.Element;
export {};
