import * as React from 'react';
export interface RawTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    colCount: number;
    initialCol?: number;
    initialRow?: number;
    jumpStep?: number;
    rowCount: number;
}
export declare const RawTable: React.ForwardRefExoticComponent<RawTableProps & React.RefAttributes<HTMLTableElement>>;
//# sourceMappingURL=RawTable.d.ts.map