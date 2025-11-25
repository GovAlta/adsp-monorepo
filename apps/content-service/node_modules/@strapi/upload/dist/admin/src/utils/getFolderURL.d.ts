import type { Query } from '../../../shared/contracts/files';
export declare const getFolderURL: (pathname: string, currentQuery: Query, { folder, folderPath }?: {
    folder?: string;
    folderPath?: string;
}) => string;
