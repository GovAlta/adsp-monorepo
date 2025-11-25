import * as React from 'react';
export interface PaginationContextValue {
    activePage: number;
    pageCount: number;
}
export declare const PaginationContext: React.Context<PaginationContextValue>;
export declare const usePagination: () => PaginationContextValue;
//# sourceMappingURL=PaginationContext.d.ts.map