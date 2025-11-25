import { AssetCardBaseProps } from './AssetCardBase';
interface ImageAssetCardProps extends Omit<AssetCardBaseProps, 'variant' | 'children'> {
    height?: number;
    width?: number;
    size?: 'S' | 'M';
    thumbnail: string;
    alt: string;
    updatedAt?: string;
    isUrlSigned: boolean;
}
export declare const ImageAssetCard: ({ height, width, thumbnail, size, alt, isUrlSigned, selected, ...props }: ImageAssetCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
