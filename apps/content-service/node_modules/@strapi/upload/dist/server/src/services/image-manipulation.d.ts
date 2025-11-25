import type { UploadableFile } from '../types';
type Dimensions = {
    width: number | null;
    height: number | null;
};
declare const _default: {
    isFaultyImage: (file: UploadableFile) => Promise<unknown>;
    isOptimizableImage: (file: UploadableFile) => Promise<boolean | undefined>;
    isResizableImage: (file: UploadableFile) => Promise<boolean | undefined>;
    isImage: (file: UploadableFile) => Promise<boolean | undefined>;
    getDimensions: (file: UploadableFile) => Promise<Dimensions>;
    generateResponsiveFormats: (file: UploadableFile) => Promise<({
        key: string;
        file: UploadableFile;
    } | undefined)[]>;
    generateThumbnail: (file: UploadableFile) => Promise<UploadableFile | null>;
    optimize: (file: UploadableFile) => Promise<UploadableFile>;
    generateFileName: (name: string) => string;
};
export default _default;
//# sourceMappingURL=image-manipulation.d.ts.map