import * as React from 'react';
import { type SimpleMenuProps } from '../SimpleMenu';
export type CrumbSimpleMenuProps = SimpleMenuProps & {
    'aria-label': string;
    icon?: React.ReactElement;
    endIcon?: React.ReactNode;
};
export declare const CrumbSimpleMenu: React.ForwardRefExoticComponent<(Omit<Omit<import("..").ButtonProps, "tag"> & {
    endIcon?: React.ReactNode;
    label?: React.ReactNode;
} & {
    tag?: (<C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "button">(props: React.PropsWithoutRef<import("..").ButtonProps<C>> & React.RefAttributes<unknown>) => React.ReactNode) | undefined;
    icon?: React.ReactNode;
} & Pick<import("../SimpleMenu/Menu").ContentProps, "intersectionId" | "popoverPlacement"> & {
    children?: React.ReactNode;
    onOpen?: (() => void) | undefined;
    onClose?: (() => void) | undefined;
    onReachEnd?: ((entry: IntersectionObserverEntry) => void) | undefined;
} & {
    'aria-label': string;
    icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined;
    endIcon?: React.ReactNode;
}, "ref"> | Omit<Omit<import("..").ButtonProps, "tag"> & {
    endIcon?: React.ReactNode;
    label?: React.ReactNode;
} & {
    tag: <C_1 extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "button">(props: React.PropsWithoutRef<import("..").IconButtonProps<C_1>> & React.RefAttributes<unknown>) => React.ReactNode;
    icon: React.ReactNode;
} & Pick<import("../SimpleMenu/Menu").ContentProps, "intersectionId" | "popoverPlacement"> & {
    children?: React.ReactNode;
    onOpen?: (() => void) | undefined;
    onClose?: (() => void) | undefined;
    onReachEnd?: ((entry: IntersectionObserverEntry) => void) | undefined;
} & {
    'aria-label': string;
    icon?: React.ReactElement<any, string | React.JSXElementConstructor<any>> | undefined;
    endIcon?: React.ReactNode;
}, "ref">) & React.RefAttributes<HTMLButtonElement>>;
//# sourceMappingURL=CrumbSimpleMenu.d.ts.map