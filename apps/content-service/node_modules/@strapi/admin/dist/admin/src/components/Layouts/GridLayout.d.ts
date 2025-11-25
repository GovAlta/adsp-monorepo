import * as React from 'react';
interface GridColSize {
    S: number;
    M: number;
}
declare const GridColSize: {
    S: number;
    M: number;
};
type Size = keyof GridColSize;
interface GridLayoutProps {
    size: Size;
    children: React.ReactNode;
}
declare const GridLayout: ({ size, children }: GridLayoutProps) => import("react/jsx-runtime").JSX.Element;
export { GridLayout };
export type { GridLayoutProps, GridColSize };
