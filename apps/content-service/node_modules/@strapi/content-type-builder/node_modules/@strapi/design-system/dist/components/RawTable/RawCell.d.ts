import * as React from 'react';
import { BoxProps } from '../../primitives/Box';
interface RawTdProps extends BoxProps<'td' | 'th'> {
    'aria-colindex'?: number;
    children?: React.ReactNode;
    coords?: {
        col: number;
        row: number;
    };
}
declare const RawTd: React.ForwardRefExoticComponent<Omit<RawTdProps, "ref"> & React.RefAttributes<HTMLTableCellElement>>;
type RawThProps = Omit<RawTdProps, 'as'>;
declare const RawTh: (props: RawThProps) => import("react/jsx-runtime").JSX.Element;
export { RawTd, RawTh };
export type { RawTdProps, RawThProps };
//# sourceMappingURL=RawCell.d.ts.map