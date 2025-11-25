import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
type DividerElement = HTMLDivElement;
interface DividerProps extends Omit<BoxProps<'div'>, 'tag'> {
}
declare const Divider: React.ForwardRefExoticComponent<Omit<DividerProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { Divider };
export type { DividerElement, DividerProps };
//# sourceMappingURL=Divider.d.ts.map