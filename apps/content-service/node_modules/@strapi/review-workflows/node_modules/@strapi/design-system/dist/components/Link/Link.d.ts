import * as React from 'react';
import { BaseLinkProps } from '../BaseLink';
type LinkProps<C extends React.ElementType = 'a'> = BaseLinkProps<C> & {
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    /**
     * @default false
     */
    isExternal?: boolean;
};
declare const Link: <C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "a">(props: React.PropsWithoutRef<LinkProps<C>> & React.RefAttributes<unknown>) => React.ReactNode;
type LinkComponent<C extends React.ElementType = 'a'> = (props: LinkProps<C>) => React.ReactNode;
export { Link };
export type { LinkProps, LinkComponent };
//# sourceMappingURL=Link.d.ts.map