import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
type PortalElement = HTMLDivElement;
interface PortalProps extends BoxProps<'div'> {
    /**
     * An optional container where the portaled content should be appended.
     */
    container?: HTMLElement | null;
}
declare const Portal: React.ForwardRefExoticComponent<Omit<PortalProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { Portal };
export type { PortalProps, PortalElement };
//# sourceMappingURL=Portal.d.ts.map