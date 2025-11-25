import * as React from 'react';
import { RawTdProps } from '../RawTable/RawCell';
export interface ThProps extends RawTdProps {
    children: React.ReactNode;
    /**
     * @deprecated just pass everything as children.
     */
    action?: React.ReactNode;
}
export declare const Th: React.ForwardRefExoticComponent<Omit<ThProps, "ref"> & React.RefAttributes<HTMLTableCellElement>>;
export declare const Td: React.ForwardRefExoticComponent<Omit<RawTdProps, "ref"> & React.RefAttributes<HTMLTableCellElement>>;
//# sourceMappingURL=Cell.d.ts.map