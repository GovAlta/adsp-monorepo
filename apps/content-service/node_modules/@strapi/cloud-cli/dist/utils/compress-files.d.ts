declare const isIgnoredFile: (folderPath: string, file: string, ignorePatterns: string[]) => boolean;
declare const compressFilesToTar: (storagePath: string, folderToCompress: string, filename: string) => Promise<void>;
export { compressFilesToTar, isIgnoredFile };
//# sourceMappingURL=compress-files.d.ts.map