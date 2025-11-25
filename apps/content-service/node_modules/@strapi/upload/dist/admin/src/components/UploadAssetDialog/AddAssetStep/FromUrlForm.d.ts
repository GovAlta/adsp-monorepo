import type { FileWithRawFile } from './AddAssetStep';
interface FromUrlFormProps {
    onClose: () => void;
    onAddAsset: (assets: FileWithRawFile[]) => void;
    trackedLocation?: string;
}
export declare const FromUrlForm: ({ onClose, onAddAsset, trackedLocation }: FromUrlFormProps) => import("react/jsx-runtime").JSX.Element;
export {};
