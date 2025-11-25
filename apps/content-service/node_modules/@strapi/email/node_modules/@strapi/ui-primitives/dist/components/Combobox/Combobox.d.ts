import * as React from 'react';
import { DismissableLayer } from '@radix-ui/react-dismissable-layer';
import * as PopperPrimitive from '@radix-ui/react-popper';
import { Portal as PortalPrimitive } from '@radix-ui/react-portal';
import { Primitive } from '@radix-ui/react-primitive';
import type { ComponentPropsWithoutRef } from '@radix-ui/react-primitive';
type AutocompleteObject = {
    type: 'none';
    filter?: never;
} | {
    type: 'list';
    filter: 'contains' | 'startsWith';
} | {
    type: 'both';
    filter: 'startsWith';
};
type Autocomplete = 'none' | 'list' | 'both' | AutocompleteObject;
interface RootProps {
    allowCustomValue?: boolean;
    autocomplete?: Autocomplete;
    children?: React.ReactNode;
    defaultOpen?: boolean;
    defaultValue?: string;
    defaultTextValue?: string;
    disabled?: boolean;
    locale?: string;
    onOpenChange?(open: boolean): void;
    onValueChange?(value: string): void;
    onTextValueChange?(textValue: string): void;
    textValue?: string;
    open?: boolean;
    required?: boolean;
    value?: string;
    defaultFilterValue?: string;
    filterValue?: string;
    onFilterValueChange?(value: string): void;
    isPrintableCharacter?: (str: string) => boolean;
    visible?: boolean;
}
type TriggerProps = PrimitiveDivProps;
type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>;
type PrimitiveButtonProps = ComponentPropsWithoutRef<typeof Primitive.button>;
type IconProps = PrimitiveButtonProps;
type IPortalProps = React.ComponentPropsWithoutRef<typeof PortalPrimitive>;
interface PortalProps extends Omit<IPortalProps, 'asChild'> {
    children?: React.ReactNode;
}
type ContentProps = ComboboxContentImplProps;
type DismissableLayerProps = React.ComponentPropsWithoutRef<typeof DismissableLayer>;
type ComboboxPopperPrivateProps = {
    onPlaced?: PopperContentProps['onPlaced'];
};
interface ComboboxContentImplProps extends Omit<ComboboxPopperPositionProps, keyof ComboboxPopperPrivateProps> {
    /**
     * Event handler called when the escape key is down.
     * Can be prevented.
     */
    onEscapeKeyDown?: DismissableLayerProps['onEscapeKeyDown'];
    /**
     * Event handler called when the a `pointerdown` event happens outside of the `DismissableLayer`.
     * Can be prevented.
     */
    onPointerDownOutside?: DismissableLayerProps['onPointerDownOutside'];
}
type PopperContentProps = React.ComponentPropsWithoutRef<typeof PopperPrimitive.Content>;
interface ComboboxPopperPositionProps extends PopperContentProps, ComboboxPopperPrivateProps {
}
type PrimitiveDivProps = ComponentPropsWithoutRef<typeof Primitive.div>;
type ViewportProps = PrimitiveDivProps;
interface ItemProps extends ItemImplProps {
    textValue?: string;
}
export declare const ComboboxItem: React.ForwardRefExoticComponent<ItemProps & React.RefAttributes<HTMLDivElement>>;
interface ItemImplProps extends PrimitiveDivProps {
    value: string;
    disabled?: boolean;
}
type PrimitiveSpanProps = ComponentPropsWithoutRef<typeof Primitive.span>;
type ItemTextProps = PrimitiveSpanProps;
type ItemIndicatorProps = PrimitiveSpanProps;
type NoValueFoundProps = PrimitiveDivProps;
interface CreateItemProps extends PrimitiveDivProps {
    disabled?: boolean;
}
declare const Root: (props: RootProps) => import("react/jsx-runtime").JSX.Element;
declare const Trigger: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
declare const TextInput: React.ForwardRefExoticComponent<TextInputProps & React.RefAttributes<HTMLInputElement>>;
declare const Icon: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "ref"> & {
    ref?: ((instance: HTMLButtonElement | null) => void) | React.RefObject<HTMLButtonElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | "asChild" | keyof React.ButtonHTMLAttributes<HTMLButtonElement>> & React.RefAttributes<HTMLButtonElement>>;
declare const Portal: {
    (props: PortalProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
declare const Content: React.ForwardRefExoticComponent<ComboboxContentImplProps & React.RefAttributes<HTMLDivElement>>;
declare const Viewport: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
declare const Item: React.ForwardRefExoticComponent<ItemProps & React.RefAttributes<HTMLDivElement>>;
declare const ItemText: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & {
    ref?: ((instance: HTMLSpanElement | null) => void) | React.RefObject<HTMLSpanElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | "asChild" | keyof React.HTMLAttributes<HTMLSpanElement>> & React.RefAttributes<HTMLSpanElement>>;
declare const ItemIndicator: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & {
    ref?: ((instance: HTMLSpanElement | null) => void) | React.RefObject<HTMLSpanElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | "asChild" | keyof React.HTMLAttributes<HTMLSpanElement>> & React.RefAttributes<HTMLSpanElement>>;
declare const NoValueFound: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
declare const CreateItem: React.ForwardRefExoticComponent<CreateItemProps & React.RefAttributes<HTMLDivElement>>;
export { Root, Trigger, TextInput, Icon, Portal, Content, Viewport, Item, ItemText, ItemIndicator, NoValueFound, CreateItem, };
export type { RootProps, TriggerProps, TextInputProps, IconProps, PortalProps, ContentProps, ViewportProps, ItemProps, ItemTextProps, ItemIndicatorProps, NoValueFoundProps, CreateItemProps, Autocomplete, AutocompleteObject, };
