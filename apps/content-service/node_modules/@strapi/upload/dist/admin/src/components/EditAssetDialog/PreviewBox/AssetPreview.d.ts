import * as React from 'react';
interface AssetPreviewProps {
    mime: string;
    name: string;
    url: string;
    onLoad?: () => void;
}
export declare const AssetPreview: React.ForwardRefExoticComponent<AssetPreviewProps & React.RefAttributes<HTMLAudioElement | HTMLVideoElement | HTMLImageElement>>;
export {};
