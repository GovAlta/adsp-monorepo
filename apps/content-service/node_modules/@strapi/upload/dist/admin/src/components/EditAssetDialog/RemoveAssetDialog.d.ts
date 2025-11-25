import type { File } from '../../../../shared/contracts/files';
interface RemoveAssetDialogProps {
    open: boolean;
    onClose: (open: boolean | null) => void;
    asset: File;
}
export declare const RemoveAssetDialog: ({ open, onClose, asset }: RemoveAssetDialogProps) => import("react/jsx-runtime").JSX.Element;
export {};
