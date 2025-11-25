import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
type BaseLinkProps<C extends React.ElementType = 'a'> = BoxProps<C> & {
    disabled?: boolean;
    isExternal?: boolean;
};
declare const BaseLinkImpl: (props: Omit<BaseLinkProps<"a">, "ref"> & React.RefAttributes<HTMLAnchorElement>) => React.ReactNode;
type BaseLinkComponent<C extends React.ElementType = 'a'> = (props: BaseLinkProps<C>) => React.ReactNode;
export { BaseLinkImpl as BaseLink };
export type { BaseLinkProps, BaseLinkComponent };
//# sourceMappingURL=BaseLink.d.ts.map