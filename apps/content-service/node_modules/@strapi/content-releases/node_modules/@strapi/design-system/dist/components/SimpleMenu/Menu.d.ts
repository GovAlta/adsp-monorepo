import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { BoxProps } from '../../primitives/Box';
import { FlexProps } from '../../primitives/Flex';
import { TypographyProps } from '../../primitives/Typography';
import { BaseLink } from '../BaseLink';
import { Button, ButtonProps } from '../Button';
import { IconButton } from '../IconButton';
import { LinkProps } from '../Link';
interface RootProps extends DropdownMenu.DropdownMenuProps {
}
type TriggerPropsBase = Omit<ButtonProps, 'tag'> & {
    endIcon?: React.ReactNode;
    label?: React.ReactNode | string;
};
type TriggerPropsWithButton = TriggerPropsBase & {
    tag?: typeof Button;
    icon?: React.ReactNode;
};
type TriggerPropsWithIconButton = TriggerPropsBase & {
    tag: typeof IconButton;
    icon: React.ReactNode;
};
type TriggerProps = TriggerPropsWithButton | TriggerPropsWithIconButton;
type ContentProps = FlexProps<'div'> & Pick<DropdownMenu.DropdownMenuContentProps, 'onCloseAutoFocus'> & {
    intersectionId?: string;
    popoverPlacement?: `${NonNullable<DropdownMenu.DropdownMenuContentProps['side']>}-${NonNullable<DropdownMenu.DropdownMenuContentProps['align']>}`;
};
export type ItemVariant = 'danger' | 'default';
interface ItemSharedProps extends Pick<DropdownMenu.MenuItemProps, 'disabled' | 'onSelect'> {
    children?: React.ReactNode;
    isExternal?: boolean;
    isFocused?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    variant?: ItemVariant;
}
interface ItemExternalLinkProps extends ItemSharedProps, Omit<LinkProps, 'onSelect'> {
    as?: never;
    isLink?: false;
    isExternal?: true;
}
type ItemInternalLinkProps<TComponent extends React.ComponentType = typeof BaseLink> = ItemSharedProps & React.ComponentPropsWithoutRef<TComponent> & {
    as?: TComponent;
    isLink?: true;
    isExternal?: false;
};
interface ItemButtonProps extends ItemSharedProps, Omit<BoxProps<'button'>, 'onSelect'> {
    as?: never;
    isLink?: false;
    isExternal?: false;
}
type ItemProps<TComponent extends React.ComponentType = typeof BaseLink> = ItemButtonProps | ItemInternalLinkProps<TComponent> | ItemExternalLinkProps;
interface SeparatorProps extends DropdownMenu.DropdownMenuSeparatorProps {
}
interface LabelProps extends TypographyProps {
}
interface SubRootProps extends DropdownMenu.DropdownMenuSubProps {
}
interface SubTriggerProps extends BoxProps<'button'> {
}
interface SubContentProps extends FlexProps<'div'> {
}
declare const Root: React.FC<DropdownMenu.DropdownMenuProps>;
declare const Trigger: React.ForwardRefExoticComponent<(Omit<TriggerPropsWithButton, "ref"> | Omit<TriggerPropsWithIconButton, "ref">) & React.RefAttributes<HTMLButtonElement>>;
declare const Content: React.ForwardRefExoticComponent<Omit<ContentProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const Item: ({ onSelect, disabled, isLink, startIcon, endIcon, isExternal, variant, ...props }: ItemProps) => import("react/jsx-runtime").JSX.Element;
declare const Separator: React.ForwardRefExoticComponent<SeparatorProps & React.RefAttributes<HTMLDivElement>>;
declare const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLSpanElement>>;
declare const SubRoot: React.FC<DropdownMenu.DropdownMenuSubProps>;
declare const SubTrigger: React.ForwardRefExoticComponent<Omit<SubTriggerProps, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const SubContent: React.ForwardRefExoticComponent<Omit<SubContentProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { Root, Trigger, Content, Item, Separator, Label, SubRoot, SubTrigger, SubContent };
export type { TriggerProps, ContentProps, ItemProps, RootProps, SubRootProps, SubTriggerProps, SubContentProps, LabelProps, };
//# sourceMappingURL=Menu.d.ts.map