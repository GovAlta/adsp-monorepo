import type { Attachment } from '../lib/types/attachments';
/**================================================================================
 * Constants
 *================================================================================*/
export declare const FIGMA_TOKEN_STORAGE_KEY = "strapi-ai-figma-token";
/**================================================================================
 * Types
 *================================================================================*/
export interface FigmaNodeData {
    id: string;
    name: string;
    type: string;
    children?: FigmaNodeData[];
    [key: string]: any;
}
export interface FigmaFileData {
    document: FigmaNodeData;
    schemaVersion: number;
    name: string;
    lastModified: string;
    thumbnailUrl: string;
    version: string;
    role: string;
}
export interface FigmaImage extends Attachment {
}
interface UseFigmaUploadOptions {
    onSuccess?: (attachments: FigmaImage[]) => void;
    onError?: (error: string) => void;
}
/**================================================================================
 * Token Storage Utils
 *================================================================================*/
/**
 * Get Figma token from localStorage
 */
export declare const getFigmaToken: () => string;
/**
 * Save Figma token to localStorage
 */
export declare const saveFigmaToken: (token: string) => void;
/**
 * Check if Figma token exists in localStorage
 */
export declare const hasFigmaToken: () => boolean;
/**================================================================================
 * Hooks
 *================================================================================*/
export declare function useFigmaUpload({ onSuccess, onError }?: UseFigmaUploadOptions): {
    processFigmaUrl: (figmaUrl: string) => Promise<{
        id: string;
        type: "file";
        filename: string | undefined;
        mediaType: string;
        url: string;
        status: "ready";
    }[] | undefined>;
    isLoading: boolean;
    error: string | null;
};
export {};
