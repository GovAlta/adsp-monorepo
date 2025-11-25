import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
import { BaseLinkProps } from '../BaseLink';
type PaginationLinkProps<C extends React.ElementType = 'a'> = BaseLinkProps<C>;
declare const PreviousLink: <C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "a">(props: React.PropsWithoutRef<PaginationLinkProps<C>> & React.RefAttributes<unknown>) => React.ReactNode;
type PreviousLinkComponent<C extends React.ElementType = 'a'> = (props: PaginationLinkProps<C>) => React.ReactNode;
declare const NextLink: <C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "a">(props: React.PropsWithoutRef<PaginationLinkProps<C>> & React.RefAttributes<unknown>) => React.ReactNode;
type NextLinkComponent<C extends React.ElementType = 'a'> = (props: PaginationLinkProps<C>) => React.ReactNode;
type PaginationPageLinkProps<C extends React.ElementType = 'a'> = PaginationLinkProps<C> & {
    number: number;
};
declare const PageLink: <C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "a">(props: React.PropsWithoutRef<PaginationPageLinkProps<C>> & React.RefAttributes<unknown>) => React.ReactNode;
type PageLinkComponent<C extends React.ElementType = 'a'> = (props: PaginationPageLinkProps<C>) => React.ReactNode;
interface DotsProps extends BoxProps {
}
declare const Dots: ({ children, ...props }: DotsProps) => import("react/jsx-runtime").JSX.Element;
export { Dots, NextLink, PageLink, PreviousLink };
export type { PaginationLinkProps, PaginationPageLinkProps, DotsProps, PageLinkComponent, PreviousLinkComponent, NextLinkComponent, };
//# sourceMappingURL=components.d.ts.map