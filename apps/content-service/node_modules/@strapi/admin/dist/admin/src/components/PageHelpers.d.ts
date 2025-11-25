import * as React from 'react';
import { type EmptyStateLayoutProps, MainProps } from '@strapi/design-system';
import { Permission } from '../features/Auth';
interface PageMainProps extends MainProps {
    children: React.ReactNode;
}
interface LoadingProps {
    /**
     * @default 'Loading content.'
     */
    children?: React.ReactNode;
}
interface ErrorProps extends Partial<EmptyStateLayoutProps> {
}
interface NoPermissionsProps extends Partial<EmptyStateLayoutProps> {
}
interface NoDataProps extends Partial<EmptyStateLayoutProps> {
}
export interface ProtectProps {
    /**
     * The children to render if the user has the required permissions.
     * If providing a function, it will be called with an object containing
     * the permissions the user has based on the array you passed to the component.
     */
    children: React.ReactNode | ((args: {
        permissions: Permission[];
    }) => React.ReactNode);
    /**
     * The permissions the user needs to have to access the content.
     */
    permissions?: Array<Omit<Partial<Permission>, 'action'> & Pick<Permission, 'action'>>;
}
export interface TitleProps {
    children: string;
}
declare const Page: {
    Error: (props: ErrorProps) => import("react/jsx-runtime").JSX.Element;
    Loading: ({ children }: LoadingProps) => import("react/jsx-runtime").JSX.Element;
    NoPermissions: (props: NoPermissionsProps) => import("react/jsx-runtime").JSX.Element;
    Protect: ({ permissions, children }: ProtectProps) => import("react/jsx-runtime").JSX.Element;
    NoData: (props: NoDataProps) => import("react/jsx-runtime").JSX.Element;
    Main: ({ children, ...restProps }: PageMainProps) => import("react/jsx-runtime").JSX.Element;
    Title: ({ children: title }: TitleProps) => null;
};
export { Page };
export type { ErrorProps, LoadingProps, NoPermissionsProps, PageMainProps as MainProps };
