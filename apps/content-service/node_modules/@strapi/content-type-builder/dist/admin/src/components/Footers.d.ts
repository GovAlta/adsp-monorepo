import type { ReactNode } from 'react';
import { TFooterProps } from '@strapi/design-system';
interface NestedTFooterProps extends TFooterProps {
    color: string;
    children: ReactNode;
    icon: ReactNode;
    onClick?: () => void;
}
export declare const NestedTFooter: ({ children, icon, color, ...props }: NestedTFooterProps) => import("react/jsx-runtime").JSX.Element;
export declare const TFooter: ({ children, icon, color, ...props }: TFooterProps & {
    color: string;
}) => import("react/jsx-runtime").JSX.Element;
export {};
