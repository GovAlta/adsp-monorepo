import * as React from 'react';
import { BaseLink } from '../BaseLink';
import * as Menu from './Menu';
type SimpleMenuProps = Menu.TriggerProps & Pick<Menu.ContentProps, 'popoverPlacement' | 'intersectionId'> & {
    children?: React.ReactNode;
    onOpen?: () => void;
    onClose?: () => void;
    /**
     * Callback function to be called when the popover reaches the end of the scrollable content
     */
    onReachEnd?: (entry: IntersectionObserverEntry) => void;
};
declare const SimpleMenu: React.ForwardRefExoticComponent<(Omit<Omit<import("..").ButtonProps, "tag"> & {
    endIcon?: React.ReactNode;
    label?: React.ReactNode;
} & {
    tag?: (<C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "button">(props: React.PropsWithoutRef<import("..").ButtonProps<C>> & React.RefAttributes<unknown>) => React.ReactNode) | undefined;
    icon?: React.ReactNode;
} & Pick<Menu.ContentProps, "intersectionId" | "popoverPlacement"> & {
    children?: React.ReactNode;
    onOpen?: (() => void) | undefined;
    onClose?: (() => void) | undefined;
    /**
     * Callback function to be called when the popover reaches the end of the scrollable content
     */
    onReachEnd?: ((entry: IntersectionObserverEntry) => void) | undefined;
}, "ref"> | Omit<Omit<import("..").ButtonProps, "tag"> & {
    endIcon?: React.ReactNode;
    label?: React.ReactNode;
} & {
    tag: <C_1 extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "button">(props: React.PropsWithoutRef<import("..").IconButtonProps<C_1>> & React.RefAttributes<unknown>) => React.ReactNode;
    icon: React.ReactNode;
} & Pick<Menu.ContentProps, "intersectionId" | "popoverPlacement"> & {
    children?: React.ReactNode;
    onOpen?: (() => void) | undefined;
    onClose?: (() => void) | undefined;
    /**
     * Callback function to be called when the popover reaches the end of the scrollable content
     */
    onReachEnd?: ((entry: IntersectionObserverEntry) => void) | undefined;
}, "ref">) & React.RefAttributes<HTMLButtonElement>>;
declare const MenuItem: ({ onSelect, disabled, isLink, startIcon, endIcon, isExternal, variant, ...props }: Menu.ItemProps<(props: Omit<import("../BaseLink").BaseLinkProps<"a">, "ref"> & React.RefAttributes<HTMLAnchorElement>) => React.ReactNode>) => import("react/jsx-runtime").JSX.Element;
type MenuItemProps<T extends React.ComponentType = typeof BaseLink> = Menu.ItemProps<T>;
export { SimpleMenu, MenuItem, Menu };
export type { SimpleMenuProps, MenuItemProps };
//# sourceMappingURL=SimpleMenu.d.ts.map