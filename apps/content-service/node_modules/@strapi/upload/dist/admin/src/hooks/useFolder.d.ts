export declare const useFolder: (id: number | null | undefined, { enabled }?: {
    enabled?: boolean | undefined;
}) => {
    data: import("../../../shared/contracts/folders").Folder | undefined;
    error: import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").NotFoundError<string, unknown> | null | undefined;
    isLoading: boolean;
};
