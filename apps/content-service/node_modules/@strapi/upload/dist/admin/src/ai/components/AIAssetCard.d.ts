import type { File } from '../../../../shared/contracts/files';
interface AssetCardProps {
    asset: File;
    onCaptionChange: (caption: string) => void;
    onAltTextChange: (altText: string) => void;
    wasCaptionChanged: boolean;
    wasAltTextChanged: boolean;
}
export declare const AIAssetCard: ({ asset, onCaptionChange, onAltTextChange, wasAltTextChanged, wasCaptionChanged, }: AssetCardProps) => import("react/jsx-runtime").JSX.Element;
export declare const AIAssetCardSkeletons: ({ count }: {
    count?: number;
}) => import("react/jsx-runtime").JSX.Element[];
export {};
