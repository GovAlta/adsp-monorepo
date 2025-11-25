import * as React from 'react';
export interface RawTableContextValue {
    rowIndex: number;
    colIndex: number;
    setTableValues: ({ rowIndex, colIndex }: {
        rowIndex: number;
        colIndex: number;
    }) => void;
}
export declare const RawTableContext: React.Context<RawTableContextValue>;
export declare const useTable: () => RawTableContextValue;
//# sourceMappingURL=RawTableContext.d.ts.map