import { AssetCardBaseProps } from './AssetCardBase';
interface AudioAssetCardProps extends Omit<AssetCardBaseProps, 'variant' | 'children'> {
    size?: 'S' | 'M';
    url: string;
}
export declare const AudioAssetCard: ({ name, url, size, selected, ...restProps }: AudioAssetCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
