import * as React from 'react';
import { BaseLinkProps } from '../BaseLink';
type SubNavLinkProps<C extends React.ElementType> = BaseLinkProps<C> & {
    active?: boolean;
    children: React.ReactNode;
    icon?: React.ReactNode;
    isSubSectionChild?: boolean;
    withBullet?: boolean;
};
declare const SubNavLink: <C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "a">(props: React.PropsWithoutRef<SubNavLinkProps<C>> & React.RefAttributes<unknown>) => React.ReactNode;
type SubNavLinkComponent<C extends React.ElementType> = (props: SubNavLinkProps<C>) => React.ReactNode;
export { SubNavLink };
export type { SubNavLinkProps, SubNavLinkComponent };
//# sourceMappingURL=SubNavLink.d.ts.map