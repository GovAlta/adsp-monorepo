import * as React from 'react';
import type { Pagination as PaginationApi } from '../../../shared/contracts/shared';
interface RootProps {
    children: React.ReactNode;
    /**
     * @default 0
     * @description the total number of pages
     * that exist in the dataset.
     */
    pageCount?: PaginationApi['pageCount'];
    /**
     * @default 1
     * @description the initial page number.
     */
    defaultPage?: PaginationApi['page'];
    /**
     * @default 10
     * @description the initial number of items to display
     */
    defaultPageSize?: PaginationApi['pageSize'];
    /**
     * @description a callback that is called when the page size changes.
     */
    onPageSizeChange?: (pageSize: string) => void;
    /**
     * @default 0
     * @description the total number of items in the dataset.
     */
    total?: PaginationApi['total'];
}
declare const Pagination: {
    Root: React.ForwardRefExoticComponent<RootProps & React.RefAttributes<HTMLDivElement>>;
    Links: ({ boundaryCount, siblingCount }: Pagination.LinksProps) => import("react/jsx-runtime").JSX.Element | null;
    PageSize: ({ options }: Pagination.PageSizeProps) => import("react/jsx-runtime").JSX.Element | null;
};
declare namespace Pagination {
    interface Props extends RootProps {
    }
    interface PageSizeProps {
        options?: string[];
    }
    interface LinksProps {
        /**
         * @default 1
         * @description Number of always visible pages at the beginning and end.
         */
        boundaryCount?: number;
        /**
         * @default 1
         * @description Number of always visible pages before and after the current page.
         */
        siblingCount?: number;
    }
}
export { Pagination };
