import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
interface SubNavProps extends Omit<BoxProps<'nav'>, 'tag'> {
}
declare const SubNav: React.ForwardRefExoticComponent<Omit<SubNavProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export { SubNav };
export type { SubNavProps };
//# sourceMappingURL=SubNav.d.ts.map