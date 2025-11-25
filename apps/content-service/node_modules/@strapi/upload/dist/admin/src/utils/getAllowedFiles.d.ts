import type { File } from '../../../shared/contracts/files';
/**
 * Returns the files that can be added to the media field
 * @param {Object[]} pluralTypes Array of string (allowedTypes)
 * @param {Object[]} files Array of files
 * @returns Object[]
 */
export interface AllowedFiles extends File {
    documentId: string;
    isSelectable: boolean;
    locale: string | null;
    type: string;
}
export declare const getAllowedFiles: (pluralTypes: string[] | null, files: AllowedFiles[]) => AllowedFiles[];
