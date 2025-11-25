import * as React from 'react';
import { BaseLink } from '../BaseLink';
import { ButtonProps } from '../Button';
type LinkButtonProps<C extends React.ElementType = typeof BaseLink> = ButtonProps<C>;
declare const LinkButton: <C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = (props: Omit<import("../BaseLink").BaseLinkProps<"a">, "ref"> & React.RefAttributes<HTMLAnchorElement>) => React.ReactNode>(props: React.PropsWithoutRef<LinkButtonProps<C>> & React.RefAttributes<unknown>) => React.ReactNode;
type LinkButtonComponent<C extends React.ElementType = 'a'> = (props: LinkButtonProps<C>) => React.ReactNode;
export { LinkButton };
export type { LinkButtonProps, LinkButtonComponent };
//# sourceMappingURL=LinkButton.d.ts.map