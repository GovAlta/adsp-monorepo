import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { type FlexProps } from '../../primitives/Flex';
import { TypographyProps } from '../../primitives/Typography';
import { ScrollAreaProps } from '../../utilities/ScrollArea';
interface Props extends Dialog.DialogProps {
}
declare const Root: React.FC<Dialog.DialogProps>;
type TriggerElement = HTMLButtonElement;
interface TriggerProps extends Omit<Dialog.DialogTriggerProps, 'asChild'> {
}
declare const Trigger: React.ForwardRefExoticComponent<TriggerProps & React.RefAttributes<HTMLButtonElement>>;
type ContentElement = HTMLDivElement;
interface ContentProps extends Dialog.DialogContentProps {
}
declare const Content: React.ForwardRefExoticComponent<ContentProps & React.RefAttributes<HTMLDivElement>>;
type CloseElement = HTMLButtonElement;
interface CloseProps extends Omit<Dialog.DialogCloseProps, 'asChild'> {
}
declare const Close: React.ForwardRefExoticComponent<CloseProps & React.RefAttributes<HTMLButtonElement>>;
type HeaderElement = HTMLDivElement;
interface HeaderProps extends Omit<FlexProps<'header'>, 'tag'> {
    /**
     * @default 'Close modal'
     * @description The label for the close button,
     * useful if you want the button to be translated
     * to other languages.
     */
    closeLabel?: string;
}
declare const Header: React.ForwardRefExoticComponent<Omit<HeaderProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
type TitleElement = HTMLHeadingElement;
interface TitleProps extends TypographyProps<'h2'> {
}
declare const Title: React.ForwardRefExoticComponent<TitleProps & React.RefAttributes<HTMLHeadingElement>>;
type BodyElement = HTMLDivElement;
interface BodyProps extends ScrollAreaProps {
}
declare const Body: React.ForwardRefExoticComponent<BodyProps & React.RefAttributes<HTMLDivElement>>;
type FooterElement = HTMLDivElement;
interface FooterProps extends Omit<FlexProps<'footer'>, 'tag'> {
}
declare const Footer: React.ForwardRefExoticComponent<Omit<FooterProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { Root, Trigger, Close, Content, Header, Title, Body, Footer };
export type { Props, TriggerElement, TriggerProps, CloseElement, CloseProps, ContentProps, ContentElement, HeaderElement, HeaderProps, TitleElement, TitleProps, BodyElement, BodyProps, FooterElement, FooterProps, };
//# sourceMappingURL=Modal.d.ts.map