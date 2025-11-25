import * as React from 'react';
declare const DragLayerRendered: () => import("react/jsx-runtime").JSX.Element | null;
declare const Root: React.FC<React.PropsWithChildren>;
interface HeaderProps {
    title: string;
    navigationAction?: React.ReactNode;
    primaryAction?: React.ReactNode;
    secondaryAction?: React.ReactNode;
    subtitle?: React.ReactNode;
}
declare const Header: React.FC<HeaderProps>;
export { DragLayerRendered, Header, Root };
