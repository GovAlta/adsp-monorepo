interface VideoPreviewProps {
    alt: string;
    url: string;
    mime: string;
    onLoadDuration?: (duration?: number) => void;
    size?: 'S' | 'M';
}
export declare const VideoPreview: ({ url, mime, onLoadDuration, alt, ...props }: VideoPreviewProps) => import("react/jsx-runtime").JSX.Element;
export {};
