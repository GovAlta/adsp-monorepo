import * as React from 'react';
import { Menu } from '@strapi/design-system';
type SimpleMenuProps = Menu.TriggerProps & Pick<Menu.ContentProps, 'popoverPlacement' | 'intersectionId'> & {
    children?: React.ReactNode;
    onOpen?: () => void;
    onClose?: () => void;
};
declare const SimpleMenu: React.ForwardRefExoticComponent<(Omit<Omit<import("@strapi/design-system").ButtonProps, "tag"> & {
    endIcon?: React.ReactNode;
    label?: React.ReactNode;
} & {
    tag?: (<C extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "button">(props: React.PropsWithoutRef<import("@strapi/design-system").ButtonProps<C>> & React.RefAttributes<unknown>) => React.ReactNode) | undefined;
    icon?: React.ReactNode;
} & Pick<Menu.ContentProps, "popoverPlacement" | "intersectionId"> & {
    children?: React.ReactNode;
    onOpen?: (() => void) | undefined;
    onClose?: (() => void) | undefined;
}, "ref"> | Omit<Omit<import("@strapi/design-system").ButtonProps, "tag"> & {
    endIcon?: React.ReactNode;
    label?: React.ReactNode;
} & {
    tag: <C_1 extends React.ElementType<any, keyof React.JSX.IntrinsicElements> = "button">(props: React.PropsWithoutRef<import("@strapi/design-system").IconButtonProps<C_1>> & React.RefAttributes<unknown>) => React.ReactNode;
    icon: React.ReactNode;
} & Pick<Menu.ContentProps, "popoverPlacement" | "intersectionId"> & {
    children?: React.ReactNode;
    onOpen?: (() => void) | undefined;
    onClose?: (() => void) | undefined;
}, "ref">) & React.RefAttributes<HTMLButtonElement>>;
declare const MenuItem: ({ onSelect, disabled, isLink, startIcon, endIcon, isExternal, variant, ...props }: Menu.ItemProps<(props: Omit<import("@strapi/design-system").BaseLinkProps<"a">, "ref"> & React.RefAttributes<HTMLAnchorElement>) => React.ReactNode>) => import("react/jsx-runtime").JSX.Element;
type MenuItemProps = Menu.ItemProps;
export { SimpleMenu, MenuItem, Menu };
export type { SimpleMenuProps, MenuItemProps };
