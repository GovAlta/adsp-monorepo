import * as React from 'react';
import { TooltipProps as DSTooltipProps, BadgeProps } from '@strapi/design-system';
import { LinkProps } from 'react-router-dom';
declare const NavLink: {
    Link: ({ children, ...props }: LinkProps) => import("react/jsx-runtime").JSX.Element;
    Tooltip: ({ children, label, position }: NavLink.TooltipProps) => import("react/jsx-runtime").JSX.Element;
    Icon: ({ label, children }: {
        label: string;
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element | null;
    Badge: ({ children, label, ...props }: NavLink.NavBadgeProps) => import("react/jsx-runtime").JSX.Element | null;
};
declare namespace NavLink {
    interface NavBadgeProps extends BadgeProps {
        children: React.ReactNode;
        label: string;
    }
    interface TooltipProps {
        children: React.ReactNode;
        label?: string;
        position?: DSTooltipProps['side'];
    }
}
export { NavLink };
