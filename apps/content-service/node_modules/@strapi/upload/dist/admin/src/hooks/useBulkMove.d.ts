import { File, BulkMoveFiles } from '../../../shared/contracts/files';
import { Folder, BulkMoveFolders } from '../../../shared/contracts/folders';
export interface FolderWithType extends Folder {
    type: string;
}
export interface FileWithType extends File {
    type: string;
}
interface BulkMoveParams {
    destinationFolderId: number | string;
    filesAndFolders: Array<FolderWithType | FileWithType>;
}
export declare const useBulkMove: () => {
    move: (destinationFolderId: number | string, filesAndFolders: Array<FolderWithType | FileWithType>) => Promise<BulkMoveFiles.Response | BulkMoveFolders.Response>;
    data: undefined;
    error: null;
    isError: false;
    isIdle: true;
    isLoading: false;
    isSuccess: false;
    status: "idle";
    mutate: import("react-query").UseMutateFunction<BulkMoveFiles.Response | BulkMoveFolders.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkMoveParams, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: BulkMoveParams | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<BulkMoveFiles.Response | BulkMoveFolders.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkMoveParams, unknown>;
} | {
    move: (destinationFolderId: number | string, filesAndFolders: Array<FolderWithType | FileWithType>) => Promise<BulkMoveFiles.Response | BulkMoveFolders.Response>;
    data: undefined;
    error: null;
    isError: false;
    isIdle: false;
    isLoading: true;
    isSuccess: false;
    status: "loading";
    mutate: import("react-query").UseMutateFunction<BulkMoveFiles.Response | BulkMoveFolders.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkMoveParams, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: BulkMoveParams | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<BulkMoveFiles.Response | BulkMoveFolders.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkMoveParams, unknown>;
} | {
    move: (destinationFolderId: number | string, filesAndFolders: Array<FolderWithType | FileWithType>) => Promise<BulkMoveFiles.Response | BulkMoveFolders.Response>;
    data: undefined;
    error: import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined;
    isError: true;
    isIdle: false;
    isLoading: false;
    isSuccess: false;
    status: "error";
    mutate: import("react-query").UseMutateFunction<BulkMoveFiles.Response | BulkMoveFolders.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkMoveParams, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: BulkMoveParams | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<BulkMoveFiles.Response | BulkMoveFolders.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkMoveParams, unknown>;
} | {
    move: (destinationFolderId: number | string, filesAndFolders: Array<FolderWithType | FileWithType>) => Promise<BulkMoveFiles.Response | BulkMoveFolders.Response>;
    data: BulkMoveFiles.Response | BulkMoveFolders.Response;
    error: null;
    isError: false;
    isIdle: false;
    isLoading: false;
    isSuccess: true;
    status: "success";
    mutate: import("react-query").UseMutateFunction<BulkMoveFiles.Response | BulkMoveFolders.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkMoveParams, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: BulkMoveParams | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<BulkMoveFiles.Response | BulkMoveFolders.Response, import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | undefined, BulkMoveParams, unknown>;
};
export {};
