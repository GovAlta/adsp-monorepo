import * as React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
type ScrollAreaElement = HTMLDivElement;
type ScrollAreaViewportElement = HTMLDivElement;
interface ScrollAreaProps extends Omit<ScrollArea.ScrollAreaProps, 'asChild'> {
    /**
     * @description This ref is attatched specifically to the viewport,
     * not the container of the viewport & scrollbars.
     */
    viewportRef?: React.Ref<ScrollAreaViewportElement>;
}
declare const ScrollAreaImpl: React.ForwardRefExoticComponent<ScrollAreaProps & React.RefAttributes<HTMLDivElement>>;
export { ScrollAreaImpl as ScrollArea };
export type { ScrollAreaProps, ScrollAreaElement, ScrollAreaViewportElement };
//# sourceMappingURL=ScrollArea.d.ts.map