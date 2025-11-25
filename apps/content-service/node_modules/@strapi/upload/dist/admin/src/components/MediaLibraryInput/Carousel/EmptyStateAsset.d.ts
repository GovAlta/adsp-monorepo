import * as React from 'react';
import type { File } from '../../../../../shared/contracts/files';
type FileWithoutIdHash = Omit<File, 'id' | 'hash'>;
interface EmptyStateAssetProps {
    disabled?: boolean;
    onClick: (asset?: File, event?: React.MouseEventHandler<HTMLButtonElement>) => void;
    onDropAsset: (assets: FileWithoutIdHash[]) => void;
}
export declare const EmptyStateAsset: ({ disabled, onClick, onDropAsset, }: EmptyStateAssetProps) => import("react/jsx-runtime").JSX.Element;
export {};
