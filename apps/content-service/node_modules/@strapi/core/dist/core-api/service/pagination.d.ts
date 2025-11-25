import { pagination } from '@strapi/utils';
interface BasePaginationParams {
    withCount?: boolean | 't' | '1' | 'true' | 'f' | '0' | 'false' | 0 | 1;
}
type PagedPagination = BasePaginationParams & {
    page?: number;
    pageSize?: number;
};
type OffsetPagination = BasePaginationParams & {
    start?: number;
    limit?: number;
};
export type PaginationParams = PagedPagination | OffsetPagination;
type PaginationInfo = {
    page: number;
    pageSize: number;
} | {
    start: number;
    limit: number;
};
declare const isPagedPagination: (pagination?: PaginationParams) => pagination is PagedPagination;
declare const shouldCount: (params: {
    pagination?: PaginationParams;
}) => boolean;
declare const getPaginationInfo: (params: {
    pagination?: PaginationParams;
}) => PaginationInfo;
declare const transformPaginationResponse: (paginationInfo: PaginationInfo, total: number | undefined, isPaged: boolean) => pagination.PagePatinationInformation | pagination.OffsetPaginationInformation;
export { isPagedPagination, shouldCount, getPaginationInfo, transformPaginationResponse };
//# sourceMappingURL=pagination.d.ts.map