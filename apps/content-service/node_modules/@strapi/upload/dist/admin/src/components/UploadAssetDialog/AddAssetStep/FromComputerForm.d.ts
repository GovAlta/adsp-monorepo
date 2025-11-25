import type { FileWithRawFile } from './AddAssetStep';
interface FromComputerFormProps {
    onClose: () => void;
    onAddAssets: (assets: FileWithRawFile[]) => void;
    trackedLocation?: string;
}
export declare const FromComputerForm: ({ onClose, onAddAssets, trackedLocation, }: FromComputerFormProps) => import("react/jsx-runtime").JSX.Element;
export {};
