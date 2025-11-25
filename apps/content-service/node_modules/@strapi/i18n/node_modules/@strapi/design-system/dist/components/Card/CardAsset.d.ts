import * as React from 'react';
type CardAssetSize = 'S' | 'M';
interface CardAssetProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    /**
     * @default 'M'
     */
    size?: CardAssetSize;
    children?: React.ReactNode;
}
declare const CardAsset: ({ size, children, ...props }: CardAssetProps) => import("react/jsx-runtime").JSX.Element;
export { CardAsset };
export type { CardAssetProps, CardAssetSize };
//# sourceMappingURL=CardAsset.d.ts.map