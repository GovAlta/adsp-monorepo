import type { File } from '../../../../shared/contracts/files';
import type { AllowedTypes } from '../AssetCard/AssetCard';
export interface AssetGridListProps {
    allowedTypes?: AllowedTypes[];
    assets: File[];
    onEditAsset?: (asset: File) => void;
    onSelectAsset: (asset: File) => void;
    selectedAssets: File[];
    size?: 'S' | 'M';
    onReorderAsset?: (fromIndex: number, toIndex: number) => void;
    title?: string | null;
}
export declare const AssetGridList: ({ allowedTypes, assets, onEditAsset, onSelectAsset, selectedAssets, size, onReorderAsset, title, }: AssetGridListProps) => import("react/jsx-runtime").JSX.Element;
