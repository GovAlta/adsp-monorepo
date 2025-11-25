import type { File } from '../../../../shared/contracts/files';
import type { AllowedTypes } from '../AssetCard/AssetCard';
export interface MediaLibraryDialogProps {
    allowedTypes?: AllowedTypes[];
    onClose: () => void;
    onSelectAssets: (selectedAssets: File[]) => void;
}
export declare const MediaLibraryDialog: ({ onClose, onSelectAssets, allowedTypes, }: MediaLibraryDialogProps) => import("react/jsx-runtime").JSX.Element;
