import * as React from 'react';
import * as RadixAccordion from '@radix-ui/react-accordion';
import { FlexProps } from '../../primitives/Flex';
type Size = 'S' | 'M';
type Variant = 'primary' | 'secondary';
interface ContextValue {
    /**
     * @default "S"
     */
    size: Size;
}
type Element = HTMLDivElement;
type Props = Omit<RadixAccordion.AccordionSingleProps, 'type'> & Partial<ContextValue>;
declare const Root: React.ForwardRefExoticComponent<Omit<RadixAccordion.AccordionSingleProps, "type"> & Partial<ContextValue> & React.RefAttributes<HTMLDivElement>>;
type ItemElement = HTMLDivElement;
interface ItemProps extends RadixAccordion.AccordionItemProps {
}
declare const Item: React.ForwardRefExoticComponent<ItemProps & React.RefAttributes<HTMLDivElement>>;
type TriggerElement = HTMLButtonElement;
interface TriggerProps extends Omit<RadixAccordion.AccordionTriggerProps, 'asChild'> {
    /**
     * @default "left"
     */
    caretPosition?: 'left' | 'right';
    description?: string;
    icon?: React.ElementType<React.SVGProps<SVGSVGElement>>;
    iconProps?: React.SVGProps<SVGSVGElement>;
}
declare const Trigger: React.ForwardRefExoticComponent<TriggerProps & React.RefAttributes<HTMLButtonElement>>;
type ActionsElement = HTMLSpanElement;
interface ActionsProps extends FlexProps<'span'> {
}
declare const Actions: React.ForwardRefExoticComponent<Omit<ActionsProps, "ref"> & React.RefAttributes<HTMLSpanElement>>;
type HeaderElement = HTMLHeadingElement;
interface HeaderProps extends Omit<RadixAccordion.AccordionHeaderProps, 'asChild'> {
    /**
     * @default "primary"
     */
    variant?: Variant;
}
declare const Header: React.ForwardRefExoticComponent<HeaderProps & React.RefAttributes<HTMLHeadingElement>>;
type ContentElement = HTMLDivElement;
interface ContentProps extends RadixAccordion.AccordionContentProps {
}
declare const Content: React.ForwardRefExoticComponent<ContentProps & React.RefAttributes<HTMLDivElement>>;
export { Root, Item, Header, Trigger, Actions, Content };
export type { ContextValue, Element, Props, ItemElement, ItemProps, HeaderElement, HeaderProps, TriggerElement, TriggerProps, ActionsElement, ActionsProps, ContentElement, ContentProps, Size, Variant, };
//# sourceMappingURL=Accordion.d.ts.map