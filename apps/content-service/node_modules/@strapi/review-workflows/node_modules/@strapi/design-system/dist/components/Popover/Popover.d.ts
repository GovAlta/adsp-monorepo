import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ScrollAreaProps } from '../../utilities/ScrollArea';
interface Props extends Popover.PopoverProps {
}
declare const Root: React.FC<Popover.PopoverProps>;
declare const Anchor: React.ForwardRefExoticComponent<Popover.PopoverAnchorProps & React.RefAttributes<HTMLDivElement>>;
declare const Arrow: React.ForwardRefExoticComponent<Popover.PopoverArrowProps & React.RefAttributes<SVGSVGElement>>;
type TriggerElement = HTMLButtonElement;
interface TriggerProps extends Omit<Popover.PopoverTriggerProps, 'asChild'> {
}
declare const Trigger: React.ForwardRefExoticComponent<TriggerProps & React.RefAttributes<HTMLButtonElement>>;
type ContentElement = HTMLDivElement;
interface ContentProps extends Popover.PopoverContentProps {
}
declare const Content: React.ForwardRefExoticComponent<ContentProps & React.RefAttributes<HTMLDivElement>>;
interface ScrollAreaImplProps extends ScrollAreaProps {
    intersectionId?: string;
    onReachEnd?: (entry: IntersectionObserverEntry) => void;
}
declare const ScrollAreaImpl: React.ForwardRefExoticComponent<ScrollAreaImplProps & React.RefAttributes<HTMLDivElement>>;
export { Root, Anchor, Trigger, Content, Arrow, ScrollAreaImpl as ScrollArea };
export type { Props, TriggerElement, TriggerProps, ContentProps, ContentElement, ScrollAreaImplProps as ScrollAreaProps, };
//# sourceMappingURL=Popover.d.ts.map