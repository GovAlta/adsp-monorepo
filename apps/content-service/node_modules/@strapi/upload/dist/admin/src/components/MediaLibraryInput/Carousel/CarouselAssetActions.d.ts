import type { File } from '../../../../../shared/contracts/files';
interface CarouselAssetActionsProps {
    asset: File;
    onDeleteAsset?: (asset: File) => void;
    onAddAsset?: (asset: File) => void;
    onEditAsset?: () => void;
}
export declare const CarouselAssetActions: ({ asset, onDeleteAsset, onAddAsset, onEditAsset, }: CarouselAssetActionsProps) => import("react/jsx-runtime").JSX.Element;
export {};
