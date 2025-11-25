interface PaginationFooterProps {
    activePage: number;
    onChangePage: (page: number) => void;
    pagination: {
        pageCount: number;
    };
}
export declare const PaginationFooter: ({ activePage, onChangePage, pagination: { pageCount }, }: PaginationFooterProps) => import("react/jsx-runtime").JSX.Element;
export {};
