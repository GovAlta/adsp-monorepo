import * as React from 'react';
import { Select } from '@strapi/ui-primitives';
import { BoxProps } from '../../primitives/Box';
import { TypographyProps } from '../../primitives/Typography';
import { Field } from '../Field';
type TriggerSize = 'S' | 'M';
interface TriggerProps extends BoxProps<'div'>, Pick<Field.InputProps, 'name' | 'id'> {
    /**
     * @default "Clear"
     */
    clearLabel?: string;
    disabled?: boolean;
    hasError?: boolean;
    onClear?: (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
    /**
     * @default "M"
     */
    size?: TriggerSize;
    startIcon?: React.ReactElement;
    withTags?: boolean;
}
interface ValueProps extends Omit<TypographyProps, 'children' | 'placeholder'>, Pick<Select.SelectValueProps, 'placeholder' | 'children'> {
    asChild?: boolean;
}
interface ItemProps extends Select.SelectItemProps {
}
declare const Root: {
    (props: Select.SelectProps & {
        __scopeSelect?: import("@radix-ui/react-context").Scope;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
declare const Trigger: React.ForwardRefExoticComponent<Omit<TriggerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const Value: React.ForwardRefExoticComponent<ValueProps & React.RefAttributes<HTMLSpanElement>>;
declare const Portal: {
    (props: Select.SelectPortalProps & {
        __scopeSelect?: import("@radix-ui/react-context").Scope;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
declare const Content: React.ForwardRefExoticComponent<Select.SelectContentImplProps & React.RefAttributes<HTMLDivElement>>;
declare const Viewport: import("styled-components/dist/types").IStyledComponentBase<"web", import("styled-components").FastOmit<Omit<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: React.RefObject<HTMLDivElement> | ((instance: HTMLDivElement | null) => void) | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined;
}, never>> & string & Omit<React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: React.RefObject<HTMLDivElement> | ((instance: HTMLDivElement | null) => void) | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>, keyof React.Component<any, {}, any>>;
declare const Item: React.ForwardRefExoticComponent<ItemProps & React.RefAttributes<HTMLDivElement>>;
declare const ItemIndicator: React.ForwardRefExoticComponent<Select.SelectItemIndicatorProps & React.RefAttributes<HTMLSpanElement>>;
declare const ItemText: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, "ref"> & {
    ref?: React.RefObject<HTMLSpanElement> | ((instance: HTMLSpanElement | null) => void) | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLSpanElement> | "asChild"> & React.RefAttributes<HTMLSpanElement>>;
declare const Group: React.ForwardRefExoticComponent<Pick<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & {
    ref?: React.RefObject<HTMLDivElement> | ((instance: HTMLDivElement | null) => void) | null | undefined;
} & {
    asChild?: boolean | undefined;
}, "key" | keyof React.HTMLAttributes<HTMLDivElement> | "asChild"> & React.RefAttributes<HTMLDivElement>>;
type SelectProps = Select.SelectProps;
type SingleSelectProps = Select.SingleSelectProps;
type MultiSelectProps = Select.MultiSelectProps;
type PortalProps = Select.SelectPortalProps;
type ContentProps = Select.SelectContentProps;
type ViewportProps = Select.SelectViewportProps;
type ItemIndicatorProps = Select.SelectItemIndicatorProps;
type ItemTextProps = Select.SelectItemTextProps;
type GroupProps = Select.SelectGroupProps;
type ValueRenderFn = Select.SelectValueRenderFn;
export { Root, Trigger, Value, Portal, Content, Viewport, Item, ItemIndicator, ItemText, Group };
export type { SingleSelectProps, MultiSelectProps, SelectProps, TriggerProps, ValueProps, ValueRenderFn, PortalProps, ContentProps, ViewportProps, ItemProps, ItemIndicatorProps, ItemTextProps, GroupProps, };
//# sourceMappingURL=SelectParts.d.ts.map