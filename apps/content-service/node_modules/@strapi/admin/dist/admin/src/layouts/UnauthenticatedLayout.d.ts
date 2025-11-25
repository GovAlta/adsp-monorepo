import * as React from 'react';
import { FlexComponent } from '@strapi/design-system';
export declare const Column: import("styled-components").IStyledComponent<"web", import("styled-components/dist/types").FastOmit<Omit<Omit<import("@strapi/design-system").FlexProps<"div">, "ref"> & React.RefAttributes<unknown>, "ref"> & {
    ref?: ((instance: unknown) => void) | React.RefObject<unknown> | null | undefined;
}, never>> & Omit<FlexComponent, keyof React.Component<any, {}, any>>;
interface LayoutContentProps {
    children: React.ReactNode;
}
export declare const LayoutContent: ({ children }: LayoutContentProps) => import("react/jsx-runtime").JSX.Element;
interface UnauthenticatedLayoutProps {
    children: React.ReactNode;
}
export declare const UnauthenticatedLayout: ({ children }: UnauthenticatedLayoutProps) => import("react/jsx-runtime").JSX.Element;
export {};
