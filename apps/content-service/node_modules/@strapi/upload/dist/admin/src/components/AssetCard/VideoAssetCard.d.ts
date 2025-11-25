import { AssetCardBaseProps } from './AssetCardBase';
interface VideoAssetCardProps extends Omit<AssetCardBaseProps, 'variant' | 'children'> {
    mime: string;
    url: string;
    size?: 'S' | 'M';
}
export declare const VideoAssetCard: ({ name, url, mime, size, selected, ...props }: VideoAssetCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
