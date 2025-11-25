import { AssetCardBaseProps } from './AssetCardBase';
interface DocAssetCardProps extends Omit<AssetCardBaseProps, 'variant' | 'children'> {
    size?: 'S' | 'M';
    extension: string;
}
export declare const DocAssetCard: ({ name, extension, size, selected, ...restProps }: DocAssetCardProps) => import("react/jsx-runtime").JSX.Element;
export {};
