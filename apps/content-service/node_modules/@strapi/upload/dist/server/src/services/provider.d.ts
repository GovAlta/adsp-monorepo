import type { Core } from '@strapi/types';
import { UploadableFile } from '../types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    checkFileSize(file: UploadableFile): Promise<void>;
    upload(file: UploadableFile): Promise<void>;
};
export default _default;
//# sourceMappingURL=provider.d.ts.map