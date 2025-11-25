import * as React from 'react';
export declare const usePagination: () => {
    activePage: number;
    pageCount: number;
};
interface PaginationProps {
    activePage: number;
    children: React.ReactNode;
    label?: string;
    pageCount: number;
}
export declare const Pagination: ({ children, activePage, pageCount, label, }: PaginationProps) => import("react/jsx-runtime").JSX.Element;
export {};
