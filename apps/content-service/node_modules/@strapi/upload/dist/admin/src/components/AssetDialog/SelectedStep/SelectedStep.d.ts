import type { File } from '../../../../../shared/contracts/files';
interface SelectedStepProps {
    onSelectAsset: (asset: File) => void;
    selectedAssets: File[];
    onReorderAsset?: (fromIndex: number, toIndex: number) => void;
}
export declare const SelectedStep: ({ selectedAssets, onSelectAsset, onReorderAsset, }: SelectedStepProps) => import("react/jsx-runtime").JSX.Element;
export {};
