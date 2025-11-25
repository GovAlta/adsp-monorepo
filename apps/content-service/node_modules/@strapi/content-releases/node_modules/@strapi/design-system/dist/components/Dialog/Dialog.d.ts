import * as React from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { FlexProps } from '../../primitives/Flex';
import { TypographyProps } from '../../primitives/Typography';
interface Props extends AlertDialog.AlertDialogProps {
}
declare const Root: React.FC<AlertDialog.AlertDialogProps>;
type TriggerElement = HTMLButtonElement;
interface TriggerProps extends Omit<AlertDialog.AlertDialogTriggerProps, 'asChild'> {
}
declare const Trigger: React.ForwardRefExoticComponent<TriggerProps & React.RefAttributes<HTMLButtonElement>>;
type ContentElement = HTMLDivElement;
interface ContentProps extends AlertDialog.AlertDialogContentProps {
}
declare const Content: React.ForwardRefExoticComponent<ContentProps & React.RefAttributes<HTMLDivElement>>;
type HeaderElement = HTMLHeadingElement;
interface HeaderProps extends TypographyProps<'h2'> {
}
declare const Header: React.ForwardRefExoticComponent<HeaderProps & React.RefAttributes<HTMLHeadingElement>>;
type BodyElement = HTMLDivElement;
interface BodyProps extends Omit<FlexProps<'div'>, 'tag'> {
    /**
     * @description optional icon to display, only rendered if
     * children is a string. If provided, it is given the height
     * & width of 24px.
     */
    icon?: React.ReactElement;
}
declare const Body: React.ForwardRefExoticComponent<Omit<BodyProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
type DescriptionElement = HTMLParagraphElement;
interface DescriptionProps extends Omit<TypographyProps<'p'>, 'tag'> {
}
declare const Description: React.ForwardRefExoticComponent<DescriptionProps & React.RefAttributes<HTMLParagraphElement>>;
type FooterElement = HTMLDivElement;
interface FooterProps extends Omit<FlexProps<'footer'>, 'tag'> {
}
declare const Footer: React.ForwardRefExoticComponent<Omit<FooterProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
type CancelElement = HTMLButtonElement;
interface CancelProps extends Omit<AlertDialog.AlertDialogCancelProps, 'asChild'> {
}
declare const Cancel: React.ForwardRefExoticComponent<CancelProps & React.RefAttributes<HTMLButtonElement>>;
type ActionElement = HTMLButtonElement;
interface ActionProps extends Omit<AlertDialog.AlertDialogActionProps, 'asChild'> {
}
declare const Action: React.ForwardRefExoticComponent<ActionProps & React.RefAttributes<HTMLButtonElement>>;
export { Root, Trigger, Content, Header, Body, Description, Footer, Cancel, Action };
export type { Props, TriggerElement, TriggerProps, ContentElement, ContentProps, HeaderElement, HeaderProps, BodyElement, BodyProps, DescriptionElement, DescriptionProps, FooterElement, FooterProps, CancelElement, CancelProps, ActionElement, ActionProps, };
//# sourceMappingURL=Dialog.d.ts.map