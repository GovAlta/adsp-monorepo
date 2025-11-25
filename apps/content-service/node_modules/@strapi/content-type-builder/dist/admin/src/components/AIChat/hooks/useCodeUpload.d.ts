import { Attachment } from '../lib/types/attachments';
export interface ProjectFile {
    path: string;
    content: string;
}
export interface ProcessOptions {
    /**
     * Additional glob patterns to ignore
     */
    ignorePatterns?: string[];
}
export declare function openZipFile(file: File, options?: ProcessOptions): Promise<ProjectFile[]>;
export declare function processFolder(files: FileList | File[], options?: ProcessOptions): Promise<{
    files: ProjectFile[];
    projectName: string;
}>;
export declare function processZipFile(file: File, options?: ProcessOptions): Promise<{
    files: ProjectFile[];
    projectName: string;
}>;
interface UseCodeUploadOptions {
    onSuccess?: (attachment: Attachment, projectName: string) => void;
    onError?: (error: string) => void;
}
export declare function useCodeUpload({ onSuccess, onError }?: UseCodeUploadOptions): {
    processZipFile: (file: File) => Promise<Attachment>;
    processFolder: (files: FileList | File[]) => Promise<Attachment>;
    isLoading: boolean;
    error: string | null;
};
export {};
