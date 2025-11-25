import * as React from 'react';
import type { File as FileAsset } from '../../../../../shared/contracts/files';
export type FileWithoutIdHash = Omit<FileAsset, 'id' | 'hash'>;
export interface CarouselAssetsProps {
    assets: FileAsset[];
    disabled?: boolean;
    error?: string;
    hint?: string;
    label: string;
    labelAction?: React.ReactNode;
    onAddAsset: (asset?: FileAsset, event?: React.MouseEventHandler<HTMLButtonElement>) => void;
    onDeleteAsset: (asset: FileAsset) => void;
    onDeleteAssetFromMediaLibrary: () => void;
    onDropAsset?: (assets: FileWithoutIdHash[]) => void;
    onEditAsset?: (asset: FileAsset) => void;
    onNext: () => void;
    onPrevious: () => void;
    required?: boolean;
    selectedAssetIndex: number;
    trackedLocation?: string;
}
export declare const CarouselAssets: React.ForwardRefExoticComponent<CarouselAssetsProps & React.RefAttributes<unknown>>;
