import * as React from 'react';
import { RawTableProps } from '../RawTable/RawTable';
export type Overflowing = 'both' | 'left' | 'right';
export interface TableProps extends RawTableProps {
    footer?: React.ReactNode;
}
export declare const Table: React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>>;
//# sourceMappingURL=Table.d.ts.map