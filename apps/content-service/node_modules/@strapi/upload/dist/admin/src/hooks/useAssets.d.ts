import { Query } from '../../../shared/contracts/files';
interface UseAssetsOptions {
    skipWhen?: boolean;
    query?: Query;
}
export declare const useAssets: ({ skipWhen, query }?: UseAssetsOptions) => {
    data: {
        results: import("../../../shared/contracts/files").File[];
        pagination: import("../../../shared/contracts/files").Pagination;
    } | undefined;
    error: import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").NotFoundError<string, unknown> | null | undefined;
    isLoading: boolean;
};
export {};
