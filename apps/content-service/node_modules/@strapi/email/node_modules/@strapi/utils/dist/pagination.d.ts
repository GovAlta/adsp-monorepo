interface PaginationArgs {
    page: number;
    pageSize: number;
    start: number;
    limit: number;
}
export interface Pagination {
    start: number;
    limit: number;
}
export interface PagePatinationInformation {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
}
export interface OffsetPaginationInformation {
    start: number;
    limit: number;
    total: number;
}
declare const withDefaultPagination: <T extends Partial<PaginationArgs>>(args: T, { defaults, maxLimit }?: {
    defaults?: {} | undefined;
    maxLimit?: number | undefined;
}) => {
    start: number;
    limit: number;
} & Partial<T>;
/**
 * Transform pagination information into a paginated response:
 * {
 *    page: number,
 *    pageSize: number,
 *    pageCount: number,
 *    total: number
 * }
 */
declare const transformPagedPaginationInfo: (paginationInfo: Partial<PaginationArgs>, total: number) => PagePatinationInformation;
/**
 * Transform pagination information into a offset response:
 * {
 *    start: number,
 *    limit: number,
 *    total: number
 * }
 */
declare const transformOffsetPaginationInfo: (paginationInfo: Partial<PaginationArgs>, total: number) => OffsetPaginationInformation;
export { withDefaultPagination, transformPagedPaginationInfo, transformOffsetPaginationInfo };
//# sourceMappingURL=pagination.d.ts.map