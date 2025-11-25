import * as React from 'react';
import { GridLayoutProps } from './GridLayout';
interface LayoutProps {
    children: React.ReactNode;
    sideNav?: React.ReactNode;
}
declare const Layouts: {
    Root: ({ sideNav, children }: LayoutProps) => import("react/jsx-runtime").JSX.Element;
    Header: {
        (props: import("./HeaderLayout").HeaderLayoutProps): import("react/jsx-runtime").JSX.Element;
        displayName: string;
    };
    BaseHeader: React.ForwardRefExoticComponent<import("./HeaderLayout").BaseHeaderLayoutProps & React.RefAttributes<HTMLDivElement>>;
    Grid: ({ size, children }: GridLayoutProps) => import("react/jsx-runtime").JSX.Element;
    Action: ({ startActions, endActions }: import("./ActionLayout").ActionLayoutProps) => import("react/jsx-runtime").JSX.Element | null;
    Content: ({ children }: import("./ContentLayout").ContentLayoutProps) => import("react/jsx-runtime").JSX.Element;
};
export { Layouts, type LayoutProps, type GridLayoutProps };
