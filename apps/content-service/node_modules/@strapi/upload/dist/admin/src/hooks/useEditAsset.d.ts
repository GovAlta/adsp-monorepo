import { File as FileAsset } from '../../../shared/contracts/files';
export type ErrorMutation = {
    message: string;
    response: {
        status: number;
        data: {
            error: Error;
        };
    };
} | null;
export declare const useEditAsset: () => {
    cancel: () => void;
    editAsset: (asset: FileAsset, file: File) => Promise<FileAsset>;
    progress: number;
    status: "error" | "success" | "idle" | "loading";
    data: undefined;
    error: null;
    isError: false;
    isIdle: true;
    isLoading: false;
    isSuccess: false;
    mutate: import("react-query").UseMutateFunction<FileAsset, ErrorMutation, {
        asset: FileAsset;
        file: File;
    }, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: {
        asset: FileAsset;
        file: File;
    } | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<FileAsset, ErrorMutation, {
        asset: FileAsset;
        file: File;
    }, unknown>;
} | {
    cancel: () => void;
    editAsset: (asset: FileAsset, file: File) => Promise<FileAsset>;
    progress: number;
    status: "error" | "success" | "idle" | "loading";
    data: undefined;
    error: null;
    isError: false;
    isIdle: false;
    isLoading: true;
    isSuccess: false;
    mutate: import("react-query").UseMutateFunction<FileAsset, ErrorMutation, {
        asset: FileAsset;
        file: File;
    }, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: {
        asset: FileAsset;
        file: File;
    } | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<FileAsset, ErrorMutation, {
        asset: FileAsset;
        file: File;
    }, unknown>;
} | {
    cancel: () => void;
    editAsset: (asset: FileAsset, file: File) => Promise<FileAsset>;
    progress: number;
    status: "error" | "success" | "idle" | "loading";
    data: undefined;
    error: ErrorMutation;
    isError: true;
    isIdle: false;
    isLoading: false;
    isSuccess: false;
    mutate: import("react-query").UseMutateFunction<FileAsset, ErrorMutation, {
        asset: FileAsset;
        file: File;
    }, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: {
        asset: FileAsset;
        file: File;
    } | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<FileAsset, ErrorMutation, {
        asset: FileAsset;
        file: File;
    }, unknown>;
} | {
    cancel: () => void;
    editAsset: (asset: FileAsset, file: File) => Promise<FileAsset>;
    progress: number;
    status: "error" | "success" | "idle" | "loading";
    data: FileAsset;
    error: null;
    isError: false;
    isIdle: false;
    isLoading: false;
    isSuccess: true;
    mutate: import("react-query").UseMutateFunction<FileAsset, ErrorMutation, {
        asset: FileAsset;
        file: File;
    }, unknown>;
    reset: () => void;
    context: unknown;
    failureCount: number;
    isPaused: boolean;
    variables: {
        asset: FileAsset;
        file: File;
    } | undefined;
    mutateAsync: import("react-query").UseMutateAsyncFunction<FileAsset, ErrorMutation, {
        asset: FileAsset;
        file: File;
    }, unknown>;
};
