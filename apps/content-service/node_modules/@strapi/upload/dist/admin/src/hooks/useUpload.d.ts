import { File, RawFile } from '../../../shared/contracts/files';
interface Asset extends Omit<File, 'id' | 'hash'> {
    rawFile?: RawFile;
    id?: File['id'];
    hash?: File['hash'];
}
export declare const useUpload: () => {
    upload: (assets: Asset | Asset[], folderId: number | null) => Promise<File[]>;
    isLoading: boolean;
    cancel: () => void;
    error: import("@strapi/utils/dist/errors").ApplicationError<"ApplicationError", string, unknown> | import("@strapi/utils/dist/errors").ValidationError<string, unknown> | null | undefined;
    progress: number;
    status: "error" | "success" | "idle" | "loading";
};
export {};
