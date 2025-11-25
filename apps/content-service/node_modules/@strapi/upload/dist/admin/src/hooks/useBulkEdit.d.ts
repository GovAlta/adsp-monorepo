import { BulkUpdateFiles } from '../../../shared/contracts/files';
interface FileInfoUpdate {
    name: string;
    alternativeText: string | null;
    caption: string | null;
    folder: number | null;
}
interface BulkEditParams {
    updates: Array<{
        id: number;
        fileInfo: FileInfoUpdate;
    }>;
}
export declare const useBulkEdit: () => {
    edit: (updates: Array<{
        id: number;
        fileInfo: FileInfoUpdate;
    }>) => Promise<BulkUpdateFiles.Response>;
    data: undefined;
    error: null;
    isError: false;
    isIdle: true;
    isLoading: false;
    isSuccess: false;
    status: "idle";
    mutate: import("react-query").UseMutateFunction<BulkUpdateFiles.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkEditParams, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: BulkEditParams | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<BulkUpdateFiles.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkEditParams, unknown>;
} | {
    edit: (updates: Array<{
        id: number;
        fileInfo: FileInfoUpdate;
    }>) => Promise<BulkUpdateFiles.Response>;
    data: undefined;
    error: null;
    isError: false;
    isIdle: false;
    isLoading: true;
    isSuccess: false;
    status: "loading";
    mutate: import("react-query").UseMutateFunction<BulkUpdateFiles.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkEditParams, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: BulkEditParams | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<BulkUpdateFiles.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkEditParams, unknown>;
} | {
    edit: (updates: Array<{
        id: number;
        fileInfo: FileInfoUpdate;
    }>) => Promise<BulkUpdateFiles.Response>;
    data: undefined;
    error: import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined;
    isError: true;
    isIdle: false;
    isLoading: false;
    isSuccess: false;
    status: "error";
    mutate: import("react-query").UseMutateFunction<BulkUpdateFiles.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkEditParams, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: BulkEditParams | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<BulkUpdateFiles.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkEditParams, unknown>;
} | {
    edit: (updates: Array<{
        id: number;
        fileInfo: FileInfoUpdate;
    }>) => Promise<BulkUpdateFiles.Response>;
    data: BulkUpdateFiles.Response;
    error: null;
    isError: false;
    isIdle: false;
    isLoading: false;
    isSuccess: true;
    status: "success";
    mutate: import("react-query").UseMutateFunction<BulkUpdateFiles.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkEditParams, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: BulkEditParams | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<BulkUpdateFiles.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkEditParams, unknown>;
};
export {};
