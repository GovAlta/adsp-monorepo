import { importDefault } from '@strapi/utils';
/**
 * Returns an Object build from a list of files matching a glob pattern in a directory
 * It builds a tree structure resembling the folder structure in dir
 */
export declare const loadFiles: <T extends object>(dir: string, pattern: string, { requireFn, shouldUseFileNameAsKey, globArgs }?: {
    requireFn?: typeof importDefault | undefined;
    shouldUseFileNameAsKey?: ((_: any) => true) | undefined;
    globArgs?: {} | undefined;
}) => Promise<T>;
//# sourceMappingURL=load-files.d.ts.map