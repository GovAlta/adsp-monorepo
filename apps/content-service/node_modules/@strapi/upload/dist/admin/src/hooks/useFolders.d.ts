import type { Query } from '../../../shared/contracts/files';
interface UseFoldersOptions {
    enabled?: boolean;
    query?: Query;
}
export declare const useFolders: ({ enabled, query }?: UseFoldersOptions) => {
    data: import("../../../shared/contracts/folders").Folder[] | undefined;
    error: import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").NotFoundError<string, unknown> | null | undefined;
    isLoading: boolean;
};
export {};
